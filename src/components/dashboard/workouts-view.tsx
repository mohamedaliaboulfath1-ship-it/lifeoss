"use client";
import { ViewShell } from "@/components/motion/view-shell";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { useToast } from "@/contexts/toast-context";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { MiniChart } from "@/components/ui/mini-chart";
import { MuscleHeatmap } from "@/components/workouts/muscle-heatmap";
import { PPLUL_PLAN } from "@/lib/lifeos-v1/defaults";
import { today, uid } from "@/lib/utils";
import type { WorkoutSetLog, YearPayload } from "@/types/lifeos";

type WorkoutTemplate = {
  id: string;
  name: string;
  splitType: string;
  daysPerWeek: number;
  schedule: { day: string; label: string; exercises?: string[]; focus?: string }[];
  notes?: string;
};

interface WorkoutsViewProps {
  yearData: YearPayload;
  workoutProgram?: string;
  onRefresh: () => void;
}

export function WorkoutsView({ yearData, workoutProgram = "PPLUL", onRefresh }: WorkoutsViewProps) {
  const { toast } = useToast();
  const [view, setView] = useState("log");
  const [modal, setModal] = useState(false);
  const [exerciseModal, setExerciseModal] = useState(false);
  const [templateModal, setTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [newExercise, setNewExercise] = useState({ name: "", muscleGroup: "", equipment: "" });
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    splitType: "ppl" as "ppl" | "upper_lower" | "full_body" | "custom",
    daysPerWeek: "4",
    notes: "",
  });
  const [exerciseFocus, setExerciseFocus] = useState("");

  const loadTemplates = useCallback(async () => {
    const res = await fetch("/api/workouts/templates");
    const json = await res.json().catch(() => ({}));
    setTemplates(json.templates ?? []);
  }, []);

  useEffect(() => { void loadTemplates(); }, [loadTemplates]);
  const exercises = yearData.exercises ?? [];
  const logs = yearData.workoutLogs ?? [];
  const selectedExercise = exerciseFocus || exercises[0]?.id || "";

  const [form, setForm] = useState({
    exerciseId: exercises[0]?.id ?? "",
    weight: "",
    reps: "",
    sets: "3",
    rpe: "",
  });

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }, []);

  const weekDays = useMemo(
    () => new Set(logs.filter((l) => l.date >= weekStart).map((l) => l.date)).size,
    [logs, weekStart]
  );

  const monthVolume = useMemo(
    () =>
      logs.reduce(
        (s, l) => s + (l.weight ?? 0) * (l.reps ?? 0) * (l.sets ?? 1),
        0
      ),
    [logs]
  );

  const bestPR = useMemo(
    () =>
      logs.reduce((best, l) => {
        const epley = (l.weight ?? 0) * (1 + (l.reps ?? 0) / 30);
        return Math.max(best, epley);
      }, 0),
    [logs]
  );

  const progressiveData = useMemo(() => {
    return logs
      .filter((l) => l.exerciseId === selectedExercise)
      .slice()
      .reverse()
      .slice(0, 10)
      .map((l) => ({
        label: l.date.slice(5),
        value: (l.weight ?? 0) * (1 + (l.reps ?? 0) / 30),
      }));
  }, [logs, selectedExercise]);

  const weeklyVolume = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of logs) {
      const key = l.date.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + (l.weight ?? 0) * (l.reps ?? 0) * (l.sets ?? 1));
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([label, value]) => ({ label: label.slice(5), value: Math.round(value) }));
  }, [logs]);

  const muscleDist = useMemo(() => {
    const nameToGroup = new Map(exercises.map((e) => [e.id, e.muscleGroup || "أخرى"]));
    const dist: Record<string, number> = {};
    logs.forEach((l) => {
      const group = nameToGroup.get(l.exerciseId || "") || "أخرى";
      dist[group] = (dist[group] ?? 0) + 1;
    });
    return Object.entries(dist).map(([label, value]) => ({ label, value }));
  }, [exercises, logs]);

  const muscleDistMap = useMemo(() => {
    const nameToGroup = new Map(exercises.map((e) => [e.id, e.muscleGroup || "أخرى"]));
    const dist: Record<string, number> = {};
    logs.forEach((l) => {
      const group = nameToGroup.get(l.exerciseId || "") || "أخرى";
      dist[group] = (dist[group] ?? 0) + 1;
    });
    return dist;
  }, [exercises, logs]);

  async function saveLog() {
    const ex = exercises.find((e) => e.id === form.exerciseId);
    const log: WorkoutSetLog = {
      id: uid(),
      date: today(),
      exerciseId: form.exerciseId,
      exerciseName: ex?.name,
      weight: parseFloat(form.weight) || 0,
      reps: parseInt(form.reps, 10) || 0,
      sets: parseInt(form.sets, 10) || 3,
      rpe: form.rpe ? parseFloat(form.rpe) : undefined,
    };
    await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "log", payload: log }),
    });
    setModal(false);
    onRefresh();
    toast("تم تسجيل التمرين", "success");
  }

  async function saveTemplate() {
    if (!newTemplate.name.trim()) return;
    const defaultSchedule = newTemplate.splitType === "ppl"
      ? [
          { day: "الأحد", label: "Push", focus: "صدر + كتف + ترايسبس" },
          { day: "الثلاثاء", label: "Pull", focus: "ظهر + بايسبس" },
          { day: "الخميس", label: "Legs", focus: "أرجل + جلوت" },
        ]
      : [{ day: "اليوم 1", label: newTemplate.name, focus: "مخصص" }];
    await fetch("/api/workouts/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTemplate.name,
        splitType: newTemplate.splitType,
        daysPerWeek: parseInt(newTemplate.daysPerWeek, 10) || 4,
        schedule: defaultSchedule,
        notes: newTemplate.notes || undefined,
      }),
    });
    setTemplateModal(false);
    setNewTemplate({ name: "", splitType: "ppl", daysPerWeek: "4", notes: "" });
    await loadTemplates();
    toast("تم حفظ القالب", "success");
  }

  async function saveExercise() {
    if (!newExercise.name.trim()) return;
    await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "exercise", payload: newExercise }),
    });
    setExerciseModal(false);
    setNewExercise({ name: "", muscleGroup: "", equipment: "" });
    onRefresh();
    toast("تم إضافة التمرين", "success");
  }

  const grouped = useMemo(() => {
    const g: Record<string, WorkoutSetLog[]> = {};
    for (const l of logs) {
      if (!g[l.date]) g[l.date] = [];
      g[l.date].push(l);
    }
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs]);

  return (
    <ViewShell>
      <PageHeader
        title="🏋️ التمارين"
        subtitle={`${workoutProgram} · ${weekDays} جلسة هذا الأسبوع`}
        actionLabel="+ تسجيل جلسة"
        onAction={() => setModal(true)}
      />

      <ViewShell.Cards>
        <KpiCard label="جلسات الأسبوع" value={`${weekDays}/5`} sub="" color="var(--rose)" />
        <KpiCard label="Volume الشهر" value={String(Math.round(monthVolume))} sub="كجم×تكرار" color="var(--gold)" />
        <KpiCard label="إجمالي السجلات" value={String(logs.length)} sub="" color="var(--sky)" />
        <KpiCard label="التمارين" value={String(exercises.length)} sub="" color="var(--emerald)" />
      </ViewShell.Cards>

      <Tabs
        tabs={[
          { id: "log", label: "📋 السجل" },
          { id: "exercises", label: "💪 تماريني" },
          { id: "plan", label: "📅 البرنامج" },
          { id: "templates", label: "🗂️ قوالب" },
          { id: "progress", label: "📈 Progress" },
          { id: "analytics", label: "🧠 Analytics" },
        ]}
        active={view}
        onChange={setView}
      />

      {view === "log" && (
        <Card className="p-4">
          {grouped.length === 0 ? (
            <EmptyState
              icon="🏋️"
              title="لم تسجل تمريناً بعد"
              actionLabel="+ أول جلسة"
              onAction={() => setModal(true)}
            />
          ) : (
            grouped.map(([date, dayLogs]) => (
              <div key={date} className="mb-4">
                <div className="text-xs text-gold2 font-mono mb-2">{date}</div>
                {dayLogs.map((l) => (
                  <div key={l.id} className="text-sm py-1 border-b border-border/40">
                    {l.exerciseName} — {l.sets}×{l.reps} @ {l.weight}كجم
                    {l.rpe ? ` RPE${l.rpe}` : ""}
                  </div>
                ))}
              </div>
            ))
          )}
        </Card>
      )}

      {view === "exercises" && (
        <Card className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm font-bold">تمارينك المخصصة</div>
            <Button variant="gold" size="sm" onClick={() => setExerciseModal(true)}>+ تمرين</Button>
          </div>
          <ul className="space-y-2 text-sm">
            {exercises.map((e) => (
              <li key={e.id} className="flex justify-between items-center border-b border-border/40 py-2">
                <span>{e.name} {e.muscleGroup ? `· ${e.muscleGroup}` : ""}</span>
                <button
                  type="button"
                  className="text-rose2 text-xs"
                  onClick={async () => {
                    await fetch(`/api/workouts?entity=exercise&id=${e.id}`, { method: "DELETE" });
                    onRefresh();
                  }}
                >
                  حذف
                </button>
              </li>
            ))}
            {!exercises.length && <li className="text-text3">أضف تمارينك — مثلاً: Bench Press، Squat، Lat Pulldown</li>}
          </ul>
        </Card>
      )}

      {view === "plan" && (
        <div className="grid md:grid-cols-2 gap-3">
          {PPLUL_PLAN.map((d) => (
            <Card key={d.day} className="p-4">
              <div className="font-bold text-gold2">{d.day}</div>
              <div className="text-sm">{d.label}</div>
              <div className="text-xs text-text3">{d.focus}</div>
            </Card>
          ))}
        </div>
      )}

      {view === "templates" && (
        <Card className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm font-bold">برامجك المخصصة</div>
            <Button variant="gold" size="sm" onClick={() => setTemplateModal(true)}>+ قالب</Button>
          </div>
          {templates.length === 0 ? (
            <EmptyState
              icon="🗂️"
              title="لا قوالب بعد"
              description="أنشئ برنامج PPL أو Upper/Lower أو Full Body"
              actionLabel="+ أول قالب"
              onAction={() => setTemplateModal(true)}
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {templates.map((t) => (
                <Card key={t.id} className="p-4 border-border2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gold2">{t.name}</div>
                      <div className="text-xs text-text3">{t.splitType} · {t.daysPerWeek} أيام/أسبوع</div>
                    </div>
                    <button
                      type="button"
                      className="text-rose2 text-xs"
                      onClick={async () => {
                        await fetch(`/api/workouts/templates?id=${t.id}`, { method: "DELETE" });
                        await loadTemplates();
                      }}
                    >
                      حذف
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {(t.schedule ?? []).slice(0, 5).map((d) => (
                      <div key={d.day} className="text-xs text-text3">{d.day}: {d.label}</div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {view === "progress" && (
        <div className="grid xl:grid-cols-3 gap-4">
          <Card className="p-4 xl:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold">Progressive Overload (1RM Est.)</div>
              <select
                className="bg-surface2 border border-border rounded-sm px-2 py-1 text-xs"
                value={selectedExercise}
                onChange={(e) => setExerciseFocus(e.target.value)}
              >
                {exercises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <MiniChart data={progressiveData} type="line" color="var(--rose)" />
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">PR Tracking</div>
            <div className="space-y-2 text-sm">
              <div className="p-2 rounded-sm border border-border2 bg-surface2">
                أفضل 1RM (Epley): <strong>{bestPR.toFixed(1)} كجم</strong>
              </div>
              <div className="p-2 rounded-sm border border-border2 bg-surface2">
                Total Volume: <strong>{Math.round(monthVolume)}</strong>
              </div>
              <div className="p-2 rounded-sm border border-gold/30 bg-gold/10 text-gold2">
                سجلات هذا الشهر: <strong>{logs.length}</strong>
              </div>
            </div>
          </Card>
        </div>
      )}

      {view === "analytics" && (
        <div className="grid xl:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">Weekly/Monthly Volume</div>
            <MiniChart data={weeklyVolume} type="bar" color="var(--gold)" />
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">Muscle Heatmap</div>
            <MuscleHeatmap distribution={muscleDistMap} />
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">Muscle Group Distribution</div>
            <MiniChart data={muscleDist} type="bar" color="var(--sky)" />
          </Card>
          <Card className="p-4 xl:col-span-2">
            <div className="text-sm font-bold mb-2">تقارير سريعة</div>
            <ul className="grid md:grid-cols-3 gap-2 text-sm">
              <li className="p-3 rounded-sm border border-border2 bg-surface2">
                متوسط الحمل/سجل:{" "}
                <strong>{logs.length ? Math.round(monthVolume / logs.length) : 0}</strong>
              </li>
              <li className="p-3 rounded-sm border border-border2 bg-surface2">
                أيام تمرين الأسبوع: <strong>{weekDays}</strong>
              </li>
              <li className="p-3 rounded-sm border border-border2 bg-surface2">
                أعلى PR: <strong>{bestPR.toFixed(1)} كجم</strong>
              </li>
            </ul>
          </Card>
        </div>
      )}

      <AppModal
        open={templateModal}
        onClose={() => setTemplateModal(false)}
        title="قالب تمرين جديد"
        icon="🏋️"
        size="md"
        onSave={saveTemplate}
        saveDisabled={!newTemplate.name.trim()}
      >
        <div><Label>الاسم</Label><Input value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="PPL Bulking" /></div>
        <div>
          <Label>نوع التقسيم</Label>
          <select
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
            value={newTemplate.splitType}
            onChange={(e) => setNewTemplate({ ...newTemplate, splitType: e.target.value as typeof newTemplate.splitType })}
          >
            <option value="ppl">PPL</option>
            <option value="upper_lower">Upper / Lower</option>
            <option value="full_body">Full Body</option>
            <option value="custom">مخصص</option>
          </select>
        </div>
        <div><Label>أيام/أسبوع</Label><Input value={newTemplate.daysPerWeek} onChange={(e) => setNewTemplate({ ...newTemplate, daysPerWeek: e.target.value })} /></div>
        <div><Label>ملاحظات</Label><Input value={newTemplate.notes} onChange={(e) => setNewTemplate({ ...newTemplate, notes: e.target.value })} /></div>
      </AppModal>

      <AppModal
        open={exerciseModal}
        onClose={() => setExerciseModal(false)}
        title="تمرين جديد"
        icon="💪"
        size="md"
        onSave={saveExercise}
        saveDisabled={!newExercise.name.trim()}
      >
        <div><Label>الاسم</Label><Input value={newExercise.name} onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} /></div>
        <div><Label>المجموعة العضلية</Label><Input value={newExercise.muscleGroup} onChange={(e) => setNewExercise({ ...newExercise, muscleGroup: e.target.value })} placeholder="صدر، ظهر..." /></div>
        <div><Label>المعدات</Label><Input value={newExercise.equipment} onChange={(e) => setNewExercise({ ...newExercise, equipment: e.target.value })} /></div>
      </AppModal>

      <AppModal
        open={modal}
        onClose={() => setModal(false)}
        title="تسجيل تمرين"
        icon="🏋️"
        size="md"
        onSave={saveLog}
      >
        <div>
          <Label>التمرين</Label>
          <select
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
            value={form.exerciseId}
            onChange={(e) => setForm({ ...form, exerciseId: e.target.value })}
          >
            {exercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>الوزن</Label>
            <Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </div>
          <div>
            <Label>تكرار</Label>
            <Input value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} />
          </div>
          <div>
            <Label>مجموعات</Label>
            <Input value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} />
          </div>
        </div>
      </AppModal>
    </ViewShell>
  );
}
