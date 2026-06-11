"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayeredCard } from "@/components/ui/layered-card";
import { SemanticBadge } from "@/components/ui/semantic-badge";
import { CountUp } from "@/components/ui/count-up";
import { AnimatedProgress } from "@/components/motion/animated-progress";
import { Button } from "@/components/ui/button";
import {
  DashboardReveal,
  CardUnfold,
  SectionReveal,
} from "@/components/motion/unfold-reveal";
import { scoreSemanticState, burnoutSemanticState } from "@/lib/design/tokens";
import { AmbientHeroBg } from "@/components/remotion/ambient-hero-bg";
import { LifeScoreOrbPlayer } from "@/components/remotion/life-score-orb-player";
import type { DashboardSnapshot } from "@/types/lifeos-pro";
import type { YearPayload } from "@/types/lifeos";
import { calcGoalProbability } from "@/lib/dashboard/goal-probability";
import type { TimeOverviewPayload } from "@/types/time";
import type { LifeBriefing } from "@/lib/ai/engine";

interface ExecutiveViewProps {
  dashboard?: DashboardSnapshot | null;
  yearData: YearPayload;
}

export function ExecutiveView({ dashboard, yearData }: ExecutiveViewProps) {
  const [timeOs, setTimeOs] = useState<TimeOverviewPayload | null>(null);
  const [briefing, setBriefing] = useState<LifeBriefing | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/time/overview").then((r) => r.json()),
      fetch("/api/v1/ai/brief?period=weekly").then((r) => r.json()),
    ])
      .then(([time, brief]) => {
        setTimeOs(time as TimeOverviewPayload);
        setBriefing((brief as { briefing?: LifeBriefing }).briefing ?? null);
      })
      .catch(() => null);
  }, []);

  const lifeScore = dashboard?.scores.lifeScore ?? 0;
  const lifeState = scoreSemanticState(lifeScore);

  const domainCards = [
    { title: "Life Score", value: lifeScore, href: "/dashboard", gradient: "gradient-indigo", state: lifeState },
    { title: "Health", value: dashboard?.scores.healthScore ?? 0, href: "/body", gradient: "gradient-emerald", state: scoreSemanticState(dashboard?.scores.healthScore ?? 0) },
    { title: "Wealth", value: dashboard?.scores.financeScore ?? 0, href: "/finance", gradient: "area-finance", state: scoreSemanticState(dashboard?.scores.financeScore ?? 0) },
    { title: "Career", value: dashboard?.scores.careerScore ?? 0, href: "/career", gradient: "area-career", state: scoreSemanticState(dashboard?.scores.careerScore ?? 0) },
    { title: "Learning", value: dashboard?.scores.learningScore ?? 0, href: "/learning", gradient: "area-learning", state: scoreSemanticState(dashboard?.scores.learningScore ?? 0) },
    { title: "Discipline", value: dashboard?.scores.disciplineScore ?? 0, href: "/habits", gradient: "gradient-orange", state: scoreSemanticState(dashboard?.scores.disciplineScore ?? 0) },
  ];

  const topThree = useMemo(() => {
    const items: { label: string; href: string; score: number }[] = [];
    if ((dashboard?.counts.tasksDueToday ?? 0) > 0) {
      items.push({ label: "أغلق مهام P1 اليوم", href: "/tasks", score: 90 });
    }
    if ((dashboard?.counts.habitsPendingToday ?? 0) > 2) {
      items.push({ label: "سجّل العادات المتبقية", href: "/habits", score: 85 });
    }
    if ((dashboard?.career.learningHoursWeek ?? 0) < 4) {
      items.push({ label: "جلستان تعلم 45 دقيقة", href: "/learning", score: 80 });
    }
    const riskGoal = yearData.goals?.find((g) => {
      const p = calcGoalProbability(g);
      return p?.label === "needs_attention";
    });
    if (riskGoal) {
      items.push({ label: `راجع: ${riskGoal.title}`, href: `/goals/${riskGoal.id}`, score: 95 });
    }
    return items.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [dashboard, yearData.goals]);

  const biggestRisk = briefing?.risks[0];
  const biggestOpportunity = briefing?.recommendations[0];
  const highestRoi = topThree[0];

  return (
    <DashboardReveal>
      <DashboardReveal.Header>
        <LayeredCard
          gradient="gradient-premium-slate"
          level={3}
          state={lifeState}
          entrance={false}
          className="p-5 md:p-6 relative overflow-hidden"
          interactive={false}
        >
          <AmbientHeroBg className="opacity-25" />
          <div className="relative z-10 flex flex-wrap items-center gap-5">
            <LifeScoreOrbPlayer score={lifeScore} size={88} />
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display text-2xl md:text-3xl font-black tracking-tight">
                  🏛️ Executive Command Center
                </h2>
                <SemanticBadge state={lifeState} text={lifeState === "growth" ? "↑ نمو" : lifeState === "critical" ? "انتباه" : undefined} />
              </div>
              <p className="text-sm text-text2 mb-3">مركز القيادة التنفيذي — أسبوعك في لمحة</p>
              <AnimatedProgress value={lifeScore} color="var(--gold)" height="h-1.5" className="max-w-xs" />
            </div>
          </div>
        </LayeredCard>
      </DashboardReveal.Header>

      <DashboardReveal.Kpis>
        {domainCards.map((c) => (
          <Link key={c.title} href={c.href}>
            <LayeredCard
              gradient={c.gradient}
              state={c.state}
              level={2}
              entrance={false}
              className="p-4 h-full"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-[10px] uppercase tracking-wider text-text3">{c.title}</div>
                <SemanticBadge state={c.state} />
              </div>
              <div className="text-3xl font-black mt-2 tabular-nums">
                <CountUp value={c.value} />
              </div>
              <AnimatedProgress
                value={c.value}
                color={c.state === "growth" ? "var(--growth)" : c.state === "critical" ? "var(--critical)" : "var(--gold)"}
                height="h-1"
                className="mt-3"
              />
            </LayeredCard>
          </Link>
        ))}
      </DashboardReveal.Kpis>

      {timeOs && (
        <DashboardReveal.Charts>
          <div className="grid md:grid-cols-4 gap-4">
            <CardUnfold index={0}>
              <TimeKpi label="Time Utilization" value={timeOs.utilizationPct} suffix="%" gradient="gradient-blue" state={timeOs.utilizationPct < 30 ? "warning" : "default"} />
            </CardUnfold>
            <CardUnfold index={1}>
              <TimeKpi label="Focus Score" value={timeOs.focusScore.score} suffix="%" gradient="gradient-emerald" state={scoreSemanticState(timeOs.focusScore.score)} />
            </CardUnfold>
            <CardUnfold index={2}>
              <TimeKpi label="Deep Work" value={timeOs.deepWorkHours.week} suffix="س" gradient="area-learning" state={timeOs.deepWorkHours.week >= 10 ? "growth" : "default"} />
            </CardUnfold>
            <CardUnfold index={3}>
              <LayeredCard gradient="gradient-orange" state={burnoutSemanticState(timeOs.burnoutRisk)} level={2} entrance={false} className="p-4" interactive={false}>
                <div className="text-[10px] uppercase tracking-wider text-text3">Burnout Risk</div>
                <div className="text-xl font-bold capitalize mt-2">{timeOs.burnoutRisk}</div>
                <SemanticBadge state={burnoutSemanticState(timeOs.burnoutRisk)} className="mt-2" />
              </LayeredCard>
            </CardUnfold>
          </div>
        </DashboardReveal.Charts>
      )}

      <DashboardReveal.Insights>
        <LayeredCard gradient="gradient-purple" level={3} entrance={false} className="p-5 space-y-4 mb-4" interactive={false}>
          <div className="text-sm font-bold text-gold2">Weekly Executive Briefing</div>
          <p className="text-sm text-text2 leading-relaxed">
            {briefing?.headline ?? `Life Score: ${lifeScore}/100 — ركّز على 3 أولويات هذا الأسبوع`}
          </p>
          <div className="text-xs font-bold text-text3">إذا ركّزت على 3 أشياء فقط هذا الأسبوع:</div>
          <ol className="space-y-2">
            {topThree.map((item, i) => (
              <li key={item.label}>
                <Link href={item.href} className="text-sm hover:text-gold2 flex items-center gap-2 group transition-colors">
                  <span className="w-6 h-6 rounded-full bg-gold/20 text-gold2 text-xs flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                    {i + 1}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
        </LayeredCard>

        <div className="grid md:grid-cols-3 gap-4">
          <CardUnfold index={0}>
            <LayeredCard gradient="gradient-emerald" state="growth" level={2} entrance={false} className="p-4 h-full" interactive={false}>
              <div className="text-[10px] text-text3 uppercase tracking-wider">Biggest Opportunity</div>
              <div className="text-sm font-bold mt-2">{biggestOpportunity?.title ?? "زخم جيد — استثمر في تعلم عميق"}</div>
              <p className="text-xs text-text3 mt-1 leading-relaxed">{biggestOpportunity?.message ?? "—"}</p>
            </LayeredCard>
          </CardUnfold>
          <CardUnfold index={1}>
            <LayeredCard gradient="gradient-rose" state="warning" level={2} entrance={false} className="p-4 h-full" interactive={false}>
              <div className="text-[10px] text-text3 uppercase tracking-wider">Biggest Risk</div>
              <div className="text-sm font-bold mt-2">{biggestRisk?.title ?? "لا مخاطر حرجة"}</div>
              <p className="text-xs text-text3 mt-1 leading-relaxed">{biggestRisk?.message ?? "—"}</p>
            </LayeredCard>
          </CardUnfold>
          <CardUnfold index={2}>
            <LayeredCard gradient="gradient-blue" state="default" level={2} entrance={false} className="p-4 h-full" interactive={false}>
              <div className="text-[10px] text-text3 uppercase tracking-wider">Highest ROI Activity</div>
              <div className="text-sm font-bold mt-2">{highestRoi?.label ?? "إغلاق مهمة P1"}</div>
              {highestRoi && (
                <Button variant="gold" size="sm" className="mt-3" onClick={() => { window.location.href = highestRoi.href; }}>
                  ابدأ الآن →
                </Button>
              )}
            </LayeredCard>
          </CardUnfold>
        </div>

        <SectionReveal index={4} className="flex flex-wrap gap-2 mt-4">
          <Button variant="gold" onClick={() => { window.location.href = "/planner"; }}>📅 Time OS</Button>
          <Button variant="ghost" onClick={() => { window.location.href = "/life-map"; }}>🗺️ Life Map</Button>
          <Button variant="ghost" onClick={() => { window.location.href = "/ai"; }}>🤖 AI Coach</Button>
        </SectionReveal>
      </DashboardReveal.Insights>
    </DashboardReveal>
  );
}

function TimeKpi({
  label,
  value,
  suffix = "",
  gradient,
  state,
}: {
  label: string;
  value: number;
  suffix?: string;
  gradient: string;
  state: ReturnType<typeof scoreSemanticState>;
}) {
  return (
    <LayeredCard gradient={gradient} state={state} level={2} entrance={false} className="p-4 h-full" interactive={false}>
      <div className="text-[10px] uppercase tracking-wider text-text3">{label}</div>
      <div className="text-2xl font-black mt-2 tabular-nums">
        <CountUp value={value} suffix={suffix} />
      </div>
    </LayeredCard>
  );
}
