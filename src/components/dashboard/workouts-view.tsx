"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { MiniChart } from "@/components/ui/mini-chart";
import { PPLUL_PLAN } from "@/lib/lifeos-v1/defaults";
import { today, uid } from "@/lib/utils";
import type { WorkoutSetLog, YearPayload } from "@/types/lifeos";

interface WorkoutsViewProps {
  yearData: YearPayload;
  onRefresh: () => void;
}

export function WorkoutsView({ yearData, onRefresh }: WorkoutsViewProps) {
  const [view, setView] = useState("log");
  const [modal, setModal] = useState(false);
  const [exerciseFocus, setExerciseFocus] = useState("");
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
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="🏋️ التمارين"
        subtitle={`PPLUL System · ${weekDays} جلسة هذا الأسبوع`}
        actionLabel="+ تسجيل جلسة"
        onAction={() => setModal(true)}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="جلسات الأسبوع" value={`${weekDays}/5`} sub="" color="var(--rose)" />
        <KpiCard label="Volume الشهر" value={String(Math.round(monthVolume))} sub="كجم×تكرار" color="var(--gold)" />
        <KpiCard label="إجمالي السجلات" value={String(logs.length)} sub="" color="var(--sky)" />
        <KpiCard label="التمارين" value={String(exercises.length)} sub="" color="var(--emerald)" />
      </div>

      <Tabs
        tabs={[
          { id: "log", label: "📋 السجل" },
          { id: "plan", label: "📅 PPLUL" },
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

      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border2 rounded-[10px] w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gold2">تسجيل تمرين</h3>
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
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setModal(false)}>
                إلغاء
              </Button>
              <Button variant="gold" onClick={saveLog}>
                حفظ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
