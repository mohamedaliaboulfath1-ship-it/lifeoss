"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOTION } from "@/lib/motion/transitions";
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
    ]).then(([time, brief]) => {
      setTimeOs(time as TimeOverviewPayload);
      setBriefing((brief as { briefing?: LifeBriefing }).briefing ?? null);
    }).catch(() => null);
  }, []);

  const lifeScore = dashboard?.scores.lifeScore ?? 0;
  const cards = [
    { title: "Life Score", value: lifeScore, href: "/dashboard", gradient: "gradient-indigo" },
    { title: "Health", value: dashboard?.scores.healthScore ?? 0, href: "/body", gradient: "gradient-emerald" },
    { title: "Wealth", value: dashboard?.scores.financeScore ?? 0, href: "/finance", gradient: "gradient-blue" },
    { title: "Career", value: dashboard?.scores.careerScore ?? 0, href: "/career", gradient: "gradient-purple" },
    { title: "Learning", value: dashboard?.scores.learningScore ?? 0, href: "/learning", gradient: "gradient-indigo" },
    { title: "Discipline", value: dashboard?.scores.disciplineScore ?? 0, href: "/habits", gradient: "gradient-orange" },
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={MOTION.spring}
      className="space-y-6"
    >
      <Card className="relative p-5 gradient-indigo floating-panel border-gold/20 overflow-hidden">
        <AmbientHeroBg className="opacity-35" />
        <div className="relative z-10 flex flex-wrap items-center gap-5">
          <LifeScoreOrbPlayer score={lifeScore} size={80} />
          <div>
            <h2 className="font-display text-2xl font-black mb-1">🏛️ Executive Command Center</h2>
            <p className="text-sm text-text3">مركز القيادة التنفيذي — أسبوعك في لمحة</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...MOTION.spring, delay: i * 0.04 }}
          >
            <Link href={c.href}>
              <Card className={`p-4 ${c.gradient} hover:shadow-md transition-shadow cursor-pointer`}>
                <div className="text-xs text-text3">{c.title}</div>
                <div className="text-2xl font-black">{c.value}</div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {timeOs && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4 gradient-blue">
            <div className="text-xs text-text3">Time Utilization</div>
            <div className="text-2xl font-black">{timeOs.utilizationPct}%</div>
          </Card>
          <Card className="p-4 gradient-emerald">
            <div className="text-xs text-text3">Focus Score</div>
            <div className="text-2xl font-black">{timeOs.focusScore.score}%</div>
          </Card>
          <Card className="p-4 gradient-purple">
            <div className="text-xs text-text3">Deep Work</div>
            <div className="text-2xl font-black">{timeOs.deepWorkHours.week}س</div>
          </Card>
          <Card className="p-4 gradient-orange">
            <div className="text-xs text-text3">Burnout Risk</div>
            <div className="text-lg font-bold capitalize">{timeOs.burnoutRisk}</div>
          </Card>
        </div>
      )}

      <Card className="p-5 gradient-purple floating-panel space-y-4">
        <div className="text-sm font-bold text-gold2">Weekly Executive Briefing</div>
        <p className="text-sm text-text2">
          {briefing?.headline ?? `Life Score: ${lifeScore}/100 — ركّز على 3 أولويات هذا الأسبوع`}
        </p>

        <div className="text-xs font-bold text-text3">إذا ركّزت على 3 أشياء فقط هذا الأسبوع:</div>
        <ol className="space-y-2">
          {topThree.map((item, i) => (
            <li key={item.label}>
              <Link href={item.href} className="text-sm hover:text-gold2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gold/20 text-gold2 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 gradient-emerald border-emerald/30">
          <div className="text-[10px] text-text3 uppercase">Biggest Opportunity</div>
          <div className="text-sm font-bold mt-2">{biggestOpportunity?.title ?? "زخم جيد — استثمر في تعلم عميق"}</div>
          <p className="text-xs text-text3 mt-1">{biggestOpportunity?.message ?? "—"}</p>
        </Card>
        <Card className="p-4 gradient-orange border-rose/30">
          <div className="text-[10px] text-text3 uppercase">Biggest Risk</div>
          <div className="text-sm font-bold mt-2">{biggestRisk?.title ?? "لا مخاطر حرجة"}</div>
          <p className="text-xs text-text3 mt-1">{biggestRisk?.message ?? "—"}</p>
        </Card>
        <Card className="p-4 gradient-blue border-sky/30">
          <div className="text-[10px] text-text3 uppercase">Highest ROI Activity</div>
          <div className="text-sm font-bold mt-2">{highestRoi?.label ?? "إغلاق مهمة P1"}</div>
          {highestRoi && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => { window.location.href = highestRoi.href; }}>
              ابدأ الآن →
            </Button>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="gold" onClick={() => { window.location.href = "/planner"; }}>📅 Time OS</Button>
        <Button variant="ghost" onClick={() => { window.location.href = "/life-map"; }}>🗺️ Life Map</Button>
        <Button variant="ghost" onClick={() => { window.location.href = "/ai"; }}>🤖 AI Coach</Button>
      </div>
    </motion.div>
  );
}
