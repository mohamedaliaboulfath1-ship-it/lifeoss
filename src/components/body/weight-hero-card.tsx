"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { BodyAnalytics } from "@/types/para";

interface Props {
  analytics: BodyAnalytics;
  weeklyRateTarget: number;
  onAddWeight: () => void;
  onUpdateCurrentWeight?: (weight: number) => Promise<void>;
}

export function WeightHeroCard({ analytics, weeklyRateTarget, onAddWeight, onUpdateCurrentWeight }: Props) {
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

  async function saveManual() {
    const w = parseFloat(manualWeight);
    if (!w || w <= 0 || !onUpdateCurrentWeight) return;
    setSaving(true);
    await onUpdateCurrentWeight(w);
    setSaving(false);
    setEditing(false);
  }

  return (
    <Card className="p-5 border-gold/20 glass-premium bg-gradient-to-br from-gold/[0.05] to-transparent">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 text-center mb-4">
        <div className="p-3 rounded-xl bg-surface/50 border border-border/40">
          <div className="text-[10px] text-text3 mb-1">الوزن الحالي</div>
          {editing ? (
            <div className="space-y-1">
              <Input type="number" step="0.1" value={manualWeight} onChange={(e) => setManualWeight(e.target.value)} className="text-center h-8" />
              <div className="flex gap-1 justify-center">
                <Button variant="gold" size="sm" onClick={saveManual} disabled={saving}>حفظ</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>✕</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-lg font-black text-gold2">{analytics.currentWeight} كجم</div>
              {onUpdateCurrentWeight && (
                <button type="button" className="text-[10px] text-gold2 hover:underline mt-1" onClick={() => { setManualWeight(String(analytics.currentWeight)); setEditing(true); }}>
                  تعديل يدوي
                </button>
              )}
            </>
          )}
        </div>
        <Stat label="الهدف" value={`${analytics.targetWeight} كجم`} accent="text-emerald2" />
        <Stat label="المتبقي" value={`${analytics.difference ?? "—"} كجم`} accent="text-sky2" />
        <Stat label="BMI" value={analytics.bmi != null ? analytics.bmi.toFixed(1) : "—"} accent="text-purple2" />
        <Stat label="معدل أسبوعي" value={`${rate} كجم`} accent="text-amber2" />
        <Stat label="التقدم" value={`${analytics.progressPct}%`} accent="text-gold2" />
      </div>
      <ProgressBar value={analytics.progressPct} color="var(--gold)" className="h-2 mb-2" />
      {analytics.forecastDate && (
        <p className="text-xs text-text3 text-center">
          الوصول المتوقع: <span className="text-gold2 font-medium">{analytics.forecastDate}</span>
          {analytics.forecastWeeks != null && ` · ~${analytics.forecastWeeks} أسبوع`}
          {" "}بمعدل {rate} كجم/أسبوع
        </p>
      )}
      <div className="flex justify-center mt-3">
        <button type="button" className="text-xs text-gold2 hover:underline" onClick={onAddWeight}>
          + تسجيل وزن جديد
        </button>
      </div>
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="p-3 rounded-xl bg-surface/50 border border-border/40">
      <div className="text-[10px] text-text3">{label}</div>
      <div className={`text-lg font-black ${accent}`}>{value}</div>
    </div>
  );
}
