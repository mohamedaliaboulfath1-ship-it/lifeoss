"use client";

import { useMemo, useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { uid, today } from "@/lib/utils";
import type { Measurement, YearPayload } from "@/types/lifeos";
import { MiniChart } from "@/components/ui/mini-chart";
import { ProgressPhotosPanel } from "@/components/body/progress-photos-panel";
import { buildBodyAnalytics } from "@/lib/body/analytics";
import { BodyPlanPanel } from "@/components/body/body-plan-panel";
import { resolveCurrentWeight, weightForecast } from "@/lib/body/weight-forecast";

interface BodyViewProps {
  yearData: YearPayload;
  startWeight?: number | null;
  targetWeight?: number | null;
  currentWeight?: number | null;
  heightCm?: number | null;
  bodyPlan?: { weeklyGainTarget?: number; workoutProgram?: string; dietPlan?: string; dietNotes?: string };
  dailyCalories?: number | null;
  proteinTarget?: number | null;
  carbsTarget?: number | null;
  fatsTarget?: number | null;
  onRefresh: () => void;
}

export function BodyView({
  yearData,
  startWeight,
  targetWeight,
  currentWeight: profileCurrent,
  heightCm,
  bodyPlan,
  dailyCalories,
  proteinTarget,
  carbsTarget,
  fatsTarget,
  onRefresh,
}: BodyViewProps) {
  const [tab, setTab] = useState("weight");
  const measurements = yearData.measureLogs ?? [];
  const weightLogs = [...(yearData.weightLogs ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const [form, setForm] = useState({ chest: "", waist: "", arm: "", thigh: "", calf: "" });
  const [quickWeight, setQuickWeight] = useState("");

  const latestLog = weightLogs[weightLogs.length - 1];
  const currentWeight = resolveCurrentWeight({
    latestLog: latestLog?.weight,
    profileCurrent: profileCurrent ?? undefined,
  });
  const start = startWeight ?? weightLogs[0]?.weight ?? currentWeight ?? null;
  const target = targetWeight ?? 75;
  const forecast =
    currentWeight != null
      ? weightForecast({
          current: currentWeight,
          target,
          start: start ?? currentWeight,
          weeklyRate: bodyPlan?.weeklyGainTarget ?? 0.35,
        })
      : null;

  const weightChartData = useMemo(
    () =>
      weightLogs.map((l) => ({
        label: l.date.slice(5),
        value: l.weight,
      })),
    [weightLogs]
  );

  const analytics = useMemo(
    () =>
      buildBodyAnalytics({
        weightLogs,
        measurements,
        startWeight: start ?? currentWeight ?? 0,
        targetWeight: target,
        heightCm,
        currentWeightOverride: profileCurrent,
      }),
    [weightLogs, measurements, start, target, heightCm, profileCurrent, currentWeight]
  );

  async function addMeasurement() {
    const m: Measurement = {
      id: uid(),
      date: today(),
      chest: form.chest ? parseFloat(form.chest) : undefined,
      waist: form.waist ? parseFloat(form.waist) : undefined,
      arm: form.arm ? parseFloat(form.arm) : undefined,
      thigh: form.thigh ? parseFloat(form.thigh) : undefined,
      calf: form.calf ? parseFloat(form.calf) : undefined,
    };
    await fetch("/api/body", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(m),
    });
    setForm({ chest: "", waist: "", arm: "", thigh: "", calf: "" });
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { id: "weight", label: "⚖️ الوزن" },
          { id: "plan", label: "⚙️ خطتي" },
          { id: "measurements", label: "📏 القياسات" },
          { id: "photos", label: "🖼️ الصور" },
          { id: "analytics", label: "📊 التحليل" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "weight" && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap gap-2 items-end mb-4">
              <div className="flex-1 min-w-[140px]">
                <Label>تحديث الوزن الحالي</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={String(analytics.currentWeight)}
                  value={quickWeight}
                  onChange={(e) => setQuickWeight(e.target.value)}
                />
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={async () => {
                  const w = parseFloat(quickWeight);
                  if (!w) return;
                  await fetch("/api/weight", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ weight: w }),
                  });
                  setQuickWeight("");
                  onRefresh();
                }}
              >
                حفظ الآن
              </Button>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-sm border border-border2 bg-surface2">
                <div className="text-text3">الوزن الحالي</div>
                <div className="text-xl font-black text-gold2">
                  {currentWeight != null ? `${currentWeight} كجم` : "—"}
                </div>
                {forecast && (
                  <div className="text-xs text-text3">متبقي: {forecast.remaining} كجم للوصول إلى {target}</div>
                )}
              </div>
              <div className="p-3 rounded-sm border border-border2 bg-surface2">
                <div className="text-text3">BMI</div>
                <div className="text-xl font-black text-sky2">{analytics.bmi ?? "—"}</div>
                <div className="text-xs text-text3">{analytics.bmiLabel}</div>
              </div>
              <div className="p-3 rounded-sm border border-border2 bg-surface2">
                <div className="text-text3">معدل أسبوعي</div>
                <div className="text-xl font-black text-emerald2">
                  {analytics.weeklyGainRate != null ? `${analytics.weeklyGainRate > 0 ? "+" : ""}${analytics.weeklyGainRate} كجم` : "—"}
                </div>
              </div>
              <div className="p-3 rounded-sm border border-border2 bg-surface2">
                <div className="text-text3">توقع الوصول</div>
                <div className="text-xl font-black text-purple2">{analytics.forecastDate ?? "—"}</div>
                <div className="text-xs text-text3">{start} → {target} كجم</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-bold mb-3">Weight Trend</div>
            <MiniChart data={weightChartData} type="line" color="var(--gold)" />
          </Card>
        </div>
      )}

      {tab === "plan" && (
        <BodyPlanPanel
          profile={{
            startWeight,
            targetWeight,
            currentWeight: profileCurrent,
            height: heightCm,
            dailyCalories,
            proteinTarget,
            carbsTarget,
            fatsTarget,
            bodyPlan,
          }}
          onSaved={onRefresh}
        />
      )}

      {tab === "measurements" && (
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><Label>الصدر</Label><Input value={form.chest} onChange={(e) => setForm({ ...form, chest: e.target.value })} /></div>
            <div><Label>الخصر</Label><Input value={form.waist} onChange={(e) => setForm({ ...form, waist: e.target.value })} /></div>
            <div><Label>الذراع</Label><Input value={form.arm} onChange={(e) => setForm({ ...form, arm: e.target.value })} /></div>
            <div><Label>الفخذ</Label><Input value={form.thigh} onChange={(e) => setForm({ ...form, thigh: e.target.value })} /></div>
            <div><Label>السمانة</Label><Input value={form.calf} onChange={(e) => setForm({ ...form, calf: e.target.value })} /></div>
          </div>
          <Button variant="gold" size="sm" onClick={addMeasurement}>
            + حفظ قياس
          </Button>
          <ul className="text-sm space-y-2">
            {[...measurements].reverse().map((m) => (
              <li key={m.id} className="border-b border-border/50 py-2 font-mono text-xs">
                {m.date} — صدر:{m.chest ?? "—"} خصر:{m.waist ?? "—"} ذراع:{m.arm ?? "—"}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "photos" && <ProgressPhotosPanel />}

      {tab === "analytics" && (
        <div className="grid xl:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">تحليل الجسم</div>
            <ul className="space-y-2 text-sm">
              <li className="p-2 rounded-sm border border-border2 bg-surface2">
                التقدم: <strong>{analytics.progressPct}%</strong>
              </li>
              <li className="p-2 rounded-sm border border-border2 bg-surface2">
                Lean Mass: <strong>{analytics.leanMass ?? "—"} كجم</strong> · Fat: <strong>{analytics.fatMass ?? "—"} كجم</strong>
              </li>
              {analytics.bestImprovedArea && (
                <li className="p-2 rounded-sm border border-emerald/30 bg-emerald/5">
                  أكبر تحسّن: <strong>{analytics.bestImprovedArea}</strong>
                </li>
              )}
              {analytics.laggingArea && (
                <li className="p-2 rounded-sm border border-amber/30 bg-amber/5">
                  منطقة متأخرة: <strong>{analytics.laggingArea}</strong>
                </li>
              )}
            </ul>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">معدل النمو الشهري</div>
            <ul className="space-y-1 text-sm">
              {Object.entries(analytics.monthlyGrowthRate).map(([k, v]) => (
                <li key={k} className="flex justify-between border-b border-border/40 py-1">
                  <span>{k}</span>
                  <span className="text-gold2 font-mono">{v > 0 ? "+" : ""}{v} سم/شهر</span>
                </li>
              ))}
              {!Object.keys(analytics.monthlyGrowthRate).length && (
                <li className="text-text3">أضف قياسين على الأقل</li>
              )}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
