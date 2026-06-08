"use client";

import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { BodyAnalytics } from "@/types/para";

interface Props {
  analytics: BodyAnalytics;
  weeklyRateTarget: number;
  onAddWeight: () => void;
}

export function WeightHeroCard({ analytics, weeklyRateTarget, onAddWeight }: Props) {
  if (!analytics.hasWeight || analytics.currentWeight == null) {
    return (
      <Card className="p-6 border-dashed border-gold/40 text-center space-y-3">
        <div className="text-3xl">⚖️</div>
        <div className="font-bold text-lg">لم يتم تسجيل الوزن بعد</div>
        <p className="text-sm text-text3">لا توجد قيم افتراضية — أدخل وزنك الحقيقي (مثلاً 62 كجم)</p>
        <button
          type="button"
          className="px-4 py-2 rounded-sm bg-gold text-[#1a1000] font-bold text-sm"
          onClick={onAddWeight}
        >
          + إضافة وزن جديد
        </button>
      </Card>
    );
  }

  const rate = analytics.weeklyGainRate ?? weeklyRateTarget;

  return (
    <Card className="p-5 border-gold/30 bg-gradient-to-br from-gold/[0.06] to-transparent">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 text-center mb-4">
        <Stat label="الوزن الحالي" value={`${analytics.currentWeight} كجم`} accent="text-gold2" />
        <Stat label="الهدف" value={`${analytics.targetWeight} كجم`} accent="text-emerald2" />
        <Stat label="المتبقي" value={`${analytics.difference ?? "—"} كجم`} accent="text-sky2" />
        <Stat label="معدل أسبوعي" value={`${rate} كجم`} accent="text-purple2" />
        <Stat
          label="الوصول المتوقع"
          value={analytics.forecastWeeks != null ? `${analytics.forecastWeeks} أسبوع` : "—"}
          accent="text-amber2"
        />
        <Stat label="التقدم" value={`${analytics.progressPct}%`} accent="text-gold2" />
      </div>
      <ProgressBar value={analytics.progressPct} color="var(--gold)" className="h-2 mb-2" />
      {analytics.forecastDate && (
        <p className="text-xs text-text3 text-center">
          ETA: {analytics.forecastDate} · بمعدل {rate} كجم/أسبوع
        </p>
      )}
      <div className="flex justify-center mt-3">
        <button type="button" className="text-xs text-gold2 hover:underline" onClick={onAddWeight}>
          + إضافة وزن جديد
        </button>
      </div>
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="p-2 rounded-sm bg-surface2/80 border border-border/50">
      <div className="text-[10px] text-text3">{label}</div>
      <div className={`text-lg font-black ${accent}`}>{value}</div>
    </div>
  );
}
