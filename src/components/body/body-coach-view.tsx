"use client";
import { ViewShell } from "@/components/motion/view-shell";

import { useMemo, useState } from "react";
import { useLifeOS } from "@/contexts/lifeos-context";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ProgressPhotosPanel } from "@/components/body/progress-photos-panel";
import { BodyPlanPanel, type BodyPlan } from "@/components/body/body-plan-panel";
import { WeightHeroCard } from "@/components/body/weight-hero-card";
import { WeightTrendPanel } from "@/components/body/weight-trend-panel";
import { buildBodyAnalytics } from "@/lib/body/analytics";
import { buildBodyCoachInsights } from "@/lib/body/coach";
import { uid, today } from "@/lib/utils";
import type { Measurement, WeightLog, YearPayload } from "@/types/lifeos";

const DEFAULT_MEASURES = [
  { key: "chest", label: "الصدر" },
  { key: "waist", label: "الخصر" },
  { key: "neck", label: "الرقبة" },
  { key: "arm", label: "الذراع" },
  { key: "forearm", label: "الساعد" },
  { key: "shoulders", label: "الكتف" },
  { key: "thigh", label: "الفخذ" },
  { key: "calf", label: "السمانة" },
  { key: "bodyFat", label: "دهون %" },
] as const;

interface Props {
  yearData: YearPayload;
  startWeight?: number | null;
  targetWeight?: number | null;
  currentWeight?: number | null;
  heightCm?: number | null;
  bodyPlan?: BodyPlan;
  dailyCalories?: number | null;
  proteinTarget?: number | null;
  carbsTarget?: number | null;
  fatsTarget?: number | null;
  onRefresh: () => void;
}

export function BodyCoachView(props: Props) {
  const { patchYearData, refreshSilent } = useLifeOS();
  const [tab, setTab] = useState("overview");
  const [weightModal, setWeightModal] = useState(false);
  const [localLogs, setLocalLogs] = useState<WeightLog[]>(
    [...(props.yearData.weightLogs ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  );
  const [weightForm, setWeightForm] = useState({ date: today(), weight: "", notes: "" });
  const [measureForm, setMeasureForm] = useState<Record<string, string>>({});

  const target = props.targetWeight ?? 75;
  const weeklyRate = props.bodyPlan?.weeklyGainTarget ?? 0.5;

  const analytics = useMemo(
    () =>
      buildBodyAnalytics({
        weightLogs: localLogs,
        measurements: props.yearData.measureLogs ?? [],
        startWeight: props.startWeight,
        targetWeight: target,
        heightCm: props.heightCm,
        currentWeightOverride: props.currentWeight,
        weeklyGainTarget: weeklyRate,
      }),
    [localLogs, props.yearData.measureLogs, props.startWeight, target, props.heightCm, props.currentWeight, weeklyRate]
  );

  const coachInsights = useMemo(
    () =>
      buildBodyCoachInsights({
        weightLogs: localLogs,
        measurements: props.yearData.measureLogs ?? [],
        current: analytics.currentWeight,
        target,
        weeklyRate,
        bodyGoal: props.bodyPlan?.bodyGoal,
      }),
    [localLogs, props.yearData.measureLogs, analytics.currentWeight, target, weeklyRate, props.bodyPlan?.bodyGoal]
  );

  async function saveWeight() {
    const w = parseFloat(weightForm.weight);
    if (!w || w <= 0) return;
    const id = uid();
    const entry: WeightLog = {
      id,
      date: weightForm.date,
      weight: w,
      note: weightForm.notes || undefined,
    };

    setLocalLogs((prev) => [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)));
    patchYearData((y) => ({
      ...y,
      weightLogs: [...(y.weightLogs ?? []), entry].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setWeightModal(false);
    setWeightForm({ date: today(), weight: "", notes: "" });

    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: entry.date, weight: w, note: entry.note }),
    });
    void refreshSilent();
  }

  async function saveMeasurement() {
    const m: Measurement = {
      id: uid(),
      date: today(),
    };
    if (measureForm.chest) m.chest = parseFloat(measureForm.chest);
    if (measureForm.waist) m.waist = parseFloat(measureForm.waist);
    if (measureForm.arm) m.arm = parseFloat(measureForm.arm);
    if (measureForm.thigh) m.thigh = parseFloat(measureForm.thigh);
    if (measureForm.calf) m.calf = parseFloat(measureForm.calf);
    if (measureForm.bodyFat) m.bodyFat = parseFloat(measureForm.bodyFat);
    await fetch("/api/body", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(m),
    });
    setMeasureForm({});
    props.onRefresh();
  }

  return (
    <ViewShell className="space-y-5">
      <Tabs
        tabs={[
          { id: "overview", label: "🏠 نظرة عامة" },
          { id: "weight", label: "⚖️ الوزن" },
          { id: "measurements", label: "📏 قياسات" },
          { id: "photos", label: "🖼️ صور" },
          { id: "plan", label: "⚙️ خطتي" },
          { id: "coach", label: "🧠 المدرب" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {(tab === "overview" || tab === "weight") && (
        <WeightHeroCard
          analytics={analytics}
          weeklyRateTarget={weeklyRate}
          onAddWeight={() => setWeightModal(true)}
          onUpdateCurrentWeight={async (w) => {
            await fetch("/api/weight", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ weight: w }),
            });
            setLocalLogs((prev) => {
              const todayStr = today();
              const existing = prev.find((l) => l.date === todayStr);
              if (existing) return prev.map((l) => (l.date === todayStr ? { ...l, weight: w } : l));
              return [...prev, { id: uid(), date: todayStr, weight: w }].sort((a, b) => a.date.localeCompare(b.date));
            });
            void refreshSilent();
          }}
        />
      )}

      {tab === "overview" && (
        <>
          {coachInsights.length > 0 && (
            <Card className="p-4 space-y-2">
              <div className="text-sm font-bold text-gold2">توصيات المدرب</div>
              {coachInsights.map((i) => (
                <div key={i.id} className="text-sm p-2 rounded-sm bg-surface2 border border-border/50">
                  {i.icon} {i.message}
                </div>
              ))}
            </Card>
          )}
          <WeightTrendPanel logs={localLogs} />
        </>
      )}

      {tab === "weight" && (
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text3 text-xs border-b border-border">
                <th className="text-right py-2">التاريخ</th>
                <th className="text-right py-2">الوزن</th>
                <th className="text-right py-2">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {[...localLogs].reverse().map((l) => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="py-2 font-mono text-xs">{l.date}</td>
                  <td className="py-2 font-bold text-gold2">{l.weight} كجم</td>
                  <td className="py-2 text-text3">{l.note ?? "—"}</td>
                </tr>
              ))}
              {!localLogs.length && (
                <tr><td colSpan={3} className="py-6 text-center text-text3">لا سجلات — اضغط «إضافة وزن جديد»</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "measurements" && (
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DEFAULT_MEASURES.map((f) => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={measureForm[f.key] ?? ""}
                  onChange={(e) => setMeasureForm({ ...measureForm, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <Button variant="gold" size="sm" onClick={saveMeasurement}>حفظ القياسات</Button>
        </Card>
      )}

      {tab === "photos" && <ProgressPhotosPanel />}
      {tab === "plan" && (
        <BodyPlanPanel
          profile={{
            startWeight: props.startWeight,
            targetWeight: props.targetWeight,
            currentWeight: props.currentWeight,
            height: props.heightCm,
            dailyCalories: props.dailyCalories,
            proteinTarget: props.proteinTarget,
            carbsTarget: props.carbsTarget,
            fatsTarget: props.fatsTarget,
            bodyPlan: props.bodyPlan,
          }}
          onSaved={props.onRefresh}
        />
      )}

      {tab === "coach" && (
        <Card className="p-4 space-y-3">
          <div className="text-sm font-bold">Life Coach — الجسم</div>
          {coachInsights.map((i) => (
            <div key={i.id} className="p-3 rounded-sm border border-border2 bg-surface2 text-sm">
              <div className="font-medium">{i.icon} {i.message}</div>
              <div className="text-xs text-gold2 mt-1">{i.action}</div>
            </div>
          ))}
          {!coachInsights.length && <p className="text-text3 text-sm">سجّل وزناً أو قياساً لتفعيل المدرب</p>}
        </Card>
      )}

      {weightModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gold2">إضافة وزن جديد</h3>
            <div>
              <Label>التاريخ</Label>
              <Input type="date" dir="ltr" value={weightForm.date} onChange={(e) => setWeightForm({ ...weightForm, date: e.target.value })} />
            </div>
            <div>
              <Label>الوزن (كجم)</Label>
              <Input type="number" step="0.1" placeholder="62" value={weightForm.weight} onChange={(e) => setWeightForm({ ...weightForm, weight: e.target.value })} />
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Input value={weightForm.notes} onChange={(e) => setWeightForm({ ...weightForm, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setWeightModal(false)}>إلغاء</Button>
              <Button variant="gold" onClick={saveWeight}>حفظ</Button>
            </div>
          </Card>
        </div>
      )}
    </ViewShell>
  );
}
