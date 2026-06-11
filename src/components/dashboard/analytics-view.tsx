"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { BentoGrid, BentoTile } from "@/components/ui/bento-grid";
import { PremiumSurface } from "@/components/motion/premium-surface";
import { AnimatedProgress } from "@/components/motion/animated-progress";
import { ProgressJourney } from "@/components/emotion/progress-journey";
import { TrendArrow } from "@/components/ui/trend-arrow";
import { DashboardReveal, AnalyticsReveal, SectionReveal } from "@/components/motion/unfold-reveal";
import { LayoutAnimateList } from "@/components/motion/layout-animate-list";
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

  const wf = analytics.weightForecast;
  const trend =
    wf.trendPerWeek > 0.1 ? "up" : wf.trendPerWeek < -0.05 ? "down" : "stable";

  return (
    <DashboardReveal>
        <DashboardReveal.Header>
        <PageHeader
          title="📊 التحليلات الذكية"
          subtitle="رؤى مستخرجة من بياناتك — سرد بصري حي"
        />
        </DashboardReveal.Header>

        <DashboardReveal.Charts>
        <BentoGrid>
          <BentoTile span="wide" delay={0}>
            <PremiumSurface variant="gradient-indigo" className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text3 mb-1">Life Intelligence</p>
                  <div className="text-4xl font-black text-gold2">{analytics.lifeScore}%</div>
                  <p className="text-sm text-text3 mt-1">نقاط الحياة الإجمالية</p>
                </div>
                <LayoutAnimateList className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 min-w-[280px]">
                  <KpiCard label="المالية" value={`${analytics.financeScore}%`} numericValue={analytics.financeScore} sub="" color="var(--emerald)" />
                  <KpiCard label="التعلم" value={`${analytics.learningScore}%`} numericValue={analytics.learningScore} sub="" color="var(--sky)" />
                  <KpiCard label="معرضة للخطر" value={String(analytics.atRisk.length)} sub="أهداف" color="var(--rose)" />
                  <KpiCard label="العادات" value={`${analytics.habitCorrelations[0]?.consistency ?? 0}%`} numericValue={analytics.habitCorrelations[0]?.consistency} sub="التزام" color="var(--gold)" />
                </LayoutAnimateList>
              </div>
            </PremiumSurface>
          </BentoTile>

          <BentoTile span="6" delay={0.05}>
            <PremiumSurface variant="gradient-cyan" className="p-5 h-full">
              <div className="font-bold text-gold2 mb-4">⚖️ رحلة التحول</div>
              {wf.current != null && wf.predicted30d != null ? (
                <>
                  <ProgressJourney
                    current={wf.current}
                    target={wf.predicted30d}
                    journeyLabel="مسار الوزن المتوقع"
                    label="Body Forecast"
                  />
                  <div className="mt-3">
                    <TrendArrow direction={trend} value={wf.trendPerWeek} unit=" كجم/أسبوع" label="الاتجاه" size="sm" />
                  </div>
                </>
              ) : (
                <p className="text-sm text-text3">سجّل وزنك لرؤية المسار</p>
              )}
            </PremiumSurface>
          </BentoTile>

          <BentoTile span="6" delay={0.08}>
            <PremiumSurface variant="gradient-purple" className="p-5 h-full">
              <div className="font-bold text-gold2 mb-3">🧭 Breakdown</div>
              <div className="space-y-3">
                {analytics.lifeScoreBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{item.label}</span>
                      <span className="font-mono text-gold2">{item.score}%</span>
                    </div>
                    <AnimatedProgress value={item.score} color="var(--sky)" height="h-1.5" />
                  </div>
                ))}
              </div>
            </PremiumSurface>
          </BentoTile>
        </BentoGrid>
        </DashboardReveal.Charts>

        <DashboardReveal.Insights>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 glass-premium">
            <div className="font-bold text-gold2 mb-4">🔍 ارتباط العادات</div>
            <LayoutAnimateList className="space-y-2 text-sm">
              {analytics.habitCorrelations.map((h) => (
                <div key={h.habitName} className="flex justify-between border-b border-border/40 pb-2">
                  <span>{h.habitName}</span>
                  <span className="font-mono text-emerald2">{h.consistency}%</span>
                </div>
              ))}
            </LayoutAnimateList>
          </Card>
          <Card className="p-4 glass-premium">
            <div className="font-bold text-gold2 mb-4">🚨 أهداف معرضة للخطر</div>
            <LayoutAnimateList className="space-y-2 text-sm">
              {analytics.atRisk.length === 0 ? (
                <p className="text-text3">✨ لا مخاطر حالياً</p>
              ) : (
                analytics.atRisk.map((g) => (
                  <div key={g.title} className="text-rose2 truncate">{g.title}</div>
                ))
              )}
            </LayoutAnimateList>
          </Card>
        </div>
        </DashboardReveal.Insights>
    </DashboardReveal>
  );
}
