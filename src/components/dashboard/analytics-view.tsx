"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageTransition } from "@/components/motion/motion";
import type { FullAnalyticsPayload } from "@/lib/analytics/score-engine";
import type { YearPayload } from "@/types/lifeos";

interface AnalyticsViewProps {
  yearData: YearPayload;
}

export function AnalyticsView({ yearData: _yearData }: AnalyticsViewProps) {
  const [analytics, setAnalytics] = useState<FullAnalyticsPayload | null>(null);

  useEffect(() => {
    fetch("/api/v1/analytics")
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(() => setAnalytics(null));
  }, []);

  if (!analytics) {
    return <p className="text-text3 text-sm p-7">جاري تحميل التحليلات...</p>;
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        title="📊 التحليلات الذكية"
        subtitle="رؤى مستخرجة من بياناتك الحقيقية"
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="نقاط الحياة" value={`${analytics.lifeScore}%`} sub="" color="var(--gold)" />
        <KpiCard
          label="المالية"
          value={`${analytics.financeScore}%`}
          sub="الصحة المالية"
          color="var(--emerald)"
        />
        <KpiCard label="التعلم" value={`${analytics.learningScore}%`} sub="مؤشر التعلم" color="var(--sky)" />
        <KpiCard label="الأهداف المعرضة" value={String(analytics.atRisk.length)} sub="بحاجة تدخل" color="var(--purple)" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="font-bold text-gold2 mb-3">⚖️ توقع الوزن</div>
          <div className="text-sm space-y-1">
            <p>الحالي: {analytics.weightForecast.current ?? "-"} كجم</p>
            <p>بعد 30 يوم: {analytics.weightForecast.predicted30d ?? "-"} كجم</p>
            <p>الاتجاه: {analytics.weightForecast.trendPerWeek > 0 ? "+" : ""}{analytics.weightForecast.trendPerWeek} كجم/أسبوع</p>
          </div>
        </Card>
        <Card className="p-4 md:col-span-2">
          <div className="font-bold text-gold2 mb-3">🧭 Breakdown نقاط الحياة</div>
          <div className="space-y-2">
            {analytics.lifeScoreBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{item.label}</span>
                  <span>{item.score}%</span>
                </div>
                <div className="h-2 rounded bg-surface2 overflow-hidden">
                  <div className="h-full bg-sky" style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="font-bold text-gold2 mb-4">🔍 ارتباط العادات</div>
          <div className="space-y-2 text-sm">
            {analytics.habitCorrelations.map((h) => (
              <div key={h.habitName} className="border border-border rounded-sm p-2">
                <div className="flex justify-between">
                  <span>{h.habitName}</span>
                  <span>{h.consistency}%</span>
                </div>
                <div className="text-xs text-text3 mt-1">
                  التأثير: {h.impact === "high" ? "مرتفع" : h.impact === "medium" ? "متوسط" : "منخفض"}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="font-bold text-gold2 mb-4">🎯 توقع الأهداف</div>
          <div className="space-y-2 text-sm">
            {analytics.goalForecasts.map((g) => (
              <div key={g.id} className="border border-border rounded-sm p-2">
                <div className="font-semibold">{g.title}</div>
                <div className="text-xs text-text3">
                  الحالي {g.progress}% · المتوقع نهاية السنة {g.expectedByYearEnd}%
                </div>
                {g.atRisk && <div className="text-xs text-rose2 mt-1">⚠️ الهدف في منطقة خطر</div>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="font-bold text-gold2 mb-4">📉 كشف الاتجاهات</div>
          <div className="space-y-2 text-sm">
            {analytics.trends.map((t) => (
              <div key={t.id} className="border border-border rounded-sm p-2 flex justify-between">
                <span>{t.label}</span>
                <span>
                  {t.direction === "up" ? "⬆️" : t.direction === "down" ? "⬇️" : "➡️"} {t.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="font-bold text-gold2 mb-4">🚨 العناصر المعرضة للخطر</div>
          <div className="space-y-2 text-sm">
            {analytics.atRisk.length === 0 && <p className="text-text3">لا عناصر حرجة حالياً.</p>}
            {analytics.atRisk.map((item) => (
              <div key={item.id} className="border border-rose/30 bg-rose/10 rounded-sm p-2">
                <div className="font-semibold">{item.title}</div>
                <div className="text-xs text-text3">{item.reason}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="font-bold text-gold2 mb-4">🧠 Executive Insights</div>
        <div className="grid md:grid-cols-2 gap-3">
          {analytics.executiveInsights.map((i, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-sm border text-sm ${
                i.priority === "high"
                  ? "border-amber/30 bg-amber/10"
                  : i.priority === "low"
                    ? "border-emerald/30 bg-emerald/10"
                    : "border-sky/30 bg-sky/10"
              }`}
            >
              <strong>
                {i.title}
              </strong>
              <p className="text-text3 text-xs mt-1">{i.detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
    </PageTransition>
  );
}
