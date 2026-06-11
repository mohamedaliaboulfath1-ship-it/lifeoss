"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { TrendArrow } from "@/components/ui/trend-arrow";
import { GoalTrajectory, buildWeightForecast } from "@/components/ui/goal-trajectory";
import { CountUp } from "@/components/ui/count-up";
import { MOTION } from "@/lib/motion";

interface WeightVizCardProps {
  current: number | null;
  target: number;
  progressPct: number;
  weeklyRate?: number | null;
  trend?: "up" | "down" | "stable";
  history?: { label: string; value: number }[];
  forecastDate?: string | null;
}

export function WeightVizCard({
  current,
  target,
  progressPct,
  weeklyRate,
  trend = "stable",
  history = [],
  forecastDate,
}: WeightVizCardProps) {
  if (!current) {
    return (
      <Card className="p-5 glass-premium border-dashed border-gold/30 text-center h-full flex flex-col justify-center">
        <div className="text-3xl mb-2">⚖️</div>
        <p className="text-sm text-text3 mb-3">ابدأ رحلة التحول — سجّل وزنك الأول</p>
        <Link href="/weight" className="text-xs text-gold2 hover:underline font-semibold">
          تسجيل الوزن →
        </Link>
      </Card>
    );
  }

  const rate = weeklyRate && weeklyRate > 0 ? weeklyRate : 0.5;
  const forecast = buildWeightForecast(current, target, rate);
  const remaining = Math.round((target - current) * 10) / 10;

  return (
    <Card className="p-4 md:p-5 glass-premium border-gold/15 bg-gradient-to-br from-gold/[0.04] via-transparent to-sky/[0.03] h-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text3 mb-1">Body Transformation</p>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={current}
              initial={{ opacity: 0.5, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={MOTION.spring.snappy}
              className="text-2xl md:text-3xl font-black text-gold2 font-mono"
            >
              <CountUp value={current} decimals={1} suffix=" كجم" />
            </motion.span>
            <span className="text-sm text-text3">→ {target} كجم</span>
          </div>
        </div>
        <ProgressRing
          value={progressPct}
          size={72}
          strokeWidth={5}
          color="var(--gold)"
          label="التقدم"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <TrendArrow
          direction={trend}
          value={weeklyRate ?? undefined}
          unit=" كجم/أسبوع"
          label="المعدل"
          size="sm"
        />
        <span className="text-[10px] px-2 py-1 rounded-full bg-surface2 border border-border text-text3">
          متبقي <strong className="text-sky2 font-mono">{remaining}</strong> كجم
        </span>
        {forecastDate && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald/10 border border-emerald/20 text-emerald2">
            ETA {forecastDate}
          </span>
        )}
      </div>

      <GoalTrajectory
        history={history}
        current={current}
        target={target}
        forecastPoints={forecast}
        height={100}
        className="rounded-xl bg-surface2/40 border border-border/40 p-2"
      />

      <Link
        href="/weight"
        className="block text-center text-[11px] text-gold2 hover:underline mt-3 opacity-80 hover:opacity-100"
      >
        تفاصيل الوزن والقياسات →
      </Link>
    </Card>
  );
}
