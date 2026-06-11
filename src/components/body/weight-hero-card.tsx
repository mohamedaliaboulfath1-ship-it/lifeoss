"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { TrendArrow } from "@/components/ui/trend-arrow";
import { GoalTrajectory, buildWeightForecast } from "@/components/ui/goal-trajectory";
import { CountUp } from "@/components/ui/count-up";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { BodyAnalytics } from "@/types/para";

interface Props {
  analytics: BodyAnalytics;
  weeklyRateTarget: number;
  weightHistory?: { label: string; value: number }[];
  onAddWeight: () => void;
  onUpdateCurrentWeight?: (weight: number) => Promise<void>;
}

export function WeightHeroCard({
  analytics,
  weeklyRateTarget,
  weightHistory = [],
  onAddWeight,
  onUpdateCurrentWeight,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [manualWeight, setManualWeight] = useState("");
  const [saving, setSaving] = useState(false);

  if (!analytics.hasWeight || analytics.currentWeight == null) {
    return (
      <Card className="p-6 border-dashed border-gold/40 text-center space-y-3 glass-premium">
        <div className="text-3xl">⚖️</div>
        <div className="font-bold text-lg">لم يتم تسجيل الوزن بعد</div>
        <p className="text-sm text-text3">أدخل وزنك الحقيقي (مثلاً 62 كجم)</p>
        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-gold text-[#1a1000] font-bold text-sm"
          onClick={onAddWeight}
        >
          + إضافة وزن جديد
        </button>
      </Card>
    );
  }

  const rate = analytics.weeklyGainRate ?? weeklyRateTarget;
  const trend =
    rate > 0.1 ? "up" : rate < -0.05 ? "down" : "stable";
  const forecast = buildWeightForecast(analytics.currentWeight, analytics.targetWeight, rate);
  const history =
    weightHistory.length >= 2
      ? weightHistory
      : analytics.startWeight
        ? [
            { label: "البداية", value: analytics.startWeight },
            { label: "الآن", value: analytics.currentWeight },
          ]
        : [{ label: "الآن", value: analytics.currentWeight }];

  async function saveManual() {
    const w = parseFloat(manualWeight);
    if (!w || w <= 0 || !onUpdateCurrentWeight) return;
    setSaving(true);
    await onUpdateCurrentWeight(w);
    setSaving(false);
    setEditing(false);
  }

  return (
    <Card className="p-5 md:p-6 border-gold/20 glass-premium bg-gradient-to-br from-gold/[0.05] to-sky/[0.03]">
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex items-start gap-4 flex-1">
          <ProgressRing
            value={analytics.progressPct}
            size={100}
            color="var(--gold)"
            label="التقدم"
          />
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-text3 mb-1">Body Transformation</p>
            {editing ? (
              <div className="space-y-2">
                <Input type="number" step="0.1" value={manualWeight} onChange={(e) => setManualWeight(e.target.value)} className="max-w-[140px]" />
                <div className="flex gap-2">
                  <Button variant="gold" size="sm" onClick={saveManual} disabled={saving}>حفظ</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>✕</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-black text-gold2 font-mono">
                  <CountUp value={analytics.currentWeight} decimals={1} suffix=" كجم" />
                </div>
                <p className="text-sm text-text3 mt-1">
                  الهدف <span className="text-emerald2 font-bold">{analytics.targetWeight} كجم</span>
                  {" · "}متبقي <span className="text-sky2 font-mono">{analytics.difference ?? "—"}</span>
                </p>
                {onUpdateCurrentWeight && (
                  <button type="button" className="text-[10px] text-gold2 hover:underline mt-1" onClick={() => { setManualWeight(String(analytics.currentWeight)); setEditing(true); }}>
                    تعديل يدوي
                  </button>
                )}
              </>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <TrendArrow direction={trend} value={rate} unit=" كجم/أسبوع" label="المعدل" size="sm" />
              {analytics.bmi != null && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-surface2 border border-border text-text3">
                  BMI {analytics.bmi.toFixed(1)} · {analytics.bmiLabel}
                </span>
              )}
              {analytics.forecastDate && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald/10 border border-emerald/20 text-emerald2">
                  ETA {analytics.forecastDate}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <GoalTrajectory
            history={history}
            current={analytics.currentWeight}
            target={analytics.targetWeight}
            forecastPoints={forecast}
            height={130}
            className="rounded-xl bg-surface2/50 border border-border/40 p-2"
          />
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <button type="button" className="text-xs text-gold2 hover:underline" onClick={onAddWeight}>
          + تسجيل وزن جديد
        </button>
      </div>
    </Card>
  );
}
