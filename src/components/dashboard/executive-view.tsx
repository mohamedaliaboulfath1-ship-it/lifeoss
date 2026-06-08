"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { DashboardSnapshot } from "@/types/lifeos-pro";
import type { YearPayload } from "@/types/lifeos";
import { calcGoalProbability } from "@/lib/dashboard/goal-probability";
import type { TimeOverviewPayload } from "@/types/time";

interface ExecutiveViewProps {
  dashboard?: DashboardSnapshot | null;
  yearData: YearPayload;
}

export function ExecutiveView({ dashboard, yearData }: ExecutiveViewProps) {
  const [timeOs, setTimeOs] = useState<TimeOverviewPayload | null>(null);

  useEffect(() => {
    void fetch("/api/time/overview").then((r) => r.json()).then(setTimeOs).catch(() => null);
  }, []);

  const lifeScore = dashboard?.scores.lifeScore ?? 0;
  const quarterProgress = Math.min(100, Math.round((dashboard?.yearProgress ?? 0) / 4 * 1.1));
  const annualProgress = dashboard?.yearProgress ?? 0;
  const goalProbability = (() => {
    const first = yearData.goals?.[0];
    if (!first) return "—";
    const result = calcGoalProbability({
      progress: first.progress ?? 0,
      target_date: first.targetDate ?? first.due,
      created_at: first.createdAt,
      status: first.status ?? (first.done ? "done" : "active"),
    });
    return result?.text ?? "—";
  })();

  const cards = [
    { title: "Life Score", value: lifeScore, color: "text-gold2" },
    { title: "Health", value: dashboard?.scores.healthScore ?? 0, color: "text-emerald" },
    { title: "Finance", value: dashboard?.scores.financeScore ?? 0, color: "text-sky" },
    { title: "Career", value: dashboard?.scores.careerScore ?? 0, color: "text-purple" },
    { title: "Learning", value: dashboard?.scores.learningScore ?? 0, color: "text-gold2" },
    { title: "Discipline", value: dashboard?.scores.disciplineScore ?? 0, color: "text-rose2" },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <Card className="p-5 bg-gradient-to-br from-gold/[0.08] to-transparent border-gold/30">
        <h2 className="font-display text-2xl font-black mb-1">🏛️ Executive Dashboard</h2>
        <p className="text-sm text-text3">ملخص تنفيذي سنوي/ربع سنوي مع قراءة حالة كل مجال</p>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.title} className="p-4">
            <div className="text-xs text-text3">{c.title}</div>
            <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-text3">Year Progress</div>
          <div className="text-3xl font-black text-gold2">{annualProgress}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text3">Quarter Progress</div>
          <div className="text-3xl font-black text-emerald">{quarterProgress}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text3">Goal Probability</div>
          <div className="text-lg font-bold text-sky">{goalProbability}</div>
        </Card>
      </div>

      {timeOs && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-xs text-text3">Time Utilization</div>
            <div className="text-2xl font-black">{timeOs.utilizationPct}%</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-text3">Focus Score</div>
            <div className="text-2xl font-black text-gold2">{timeOs.focusScore.score}%</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-text3">Deep Work (أسبوع)</div>
            <div className="text-2xl font-black">{timeOs.deepWorkHours.week}س</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-text3">Burnout Risk</div>
            <div className="text-lg font-bold capitalize">{timeOs.burnoutRisk}</div>
            <Link href="/time" className="text-[10px] text-gold2">Time Intelligence →</Link>
          </Card>
        </div>
      )}

      <Card className="p-4 space-y-2">
        <h3 className="font-bold text-gold2">Executive Summary</h3>
        <p className="text-sm text-text2">
          الأداء الحالي يشير إلى زخم جيد في المسار العام مع حاجة لرفع وتيرة التعلم والتحرك على الأهداف ذات الخطر المرتفع.
          الأولوية التنفيذية لهذا الأسبوع: إغلاق مهام P1، وتثبيت جلسات تعلم مهنية، ومراجعة هدف مالي واحد.
        </p>
      </Card>
    </div>
  );
}
