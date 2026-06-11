"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { BentoGrid, BentoTile } from "@/components/ui/bento-grid";
import { WeightVizCard } from "@/components/visual/weight-viz-card";
import { buildWeightForecast } from "@/components/ui/goal-trajectory";
import { MOTION } from "@/lib/motion/transitions";
import { areaColor } from "@/lib/calculations";
import type { Goal, Habit } from "@/types/lifeos";
import type { GoalCompletion } from "@/types/para";

interface GoalBundle {
  goal: Goal;
  completion: GoalCompletion;
  habits: Habit[];
  tasks: { id: string; title: string; status: string; priority?: string; dueDate?: string }[];
  books: { id: string; title: string; progress: number; status?: string }[];
  timeBlocks: { id: string; title: string; startAt: string; status: string }[];
  bodyMetrics?: {
    currentWeight: number;
    targetWeight: number;
    remaining: number;
    weeklyGain: number;
    eta?: string;
    progressPct: number;
  } | null;
  measurements: { date: string; chest?: number; waist?: number; arm?: number }[];
  progressPhotos: { date: string; angle?: string; weight?: number }[];
}

interface GoalCommandCenterProps {
  goalId: string;
}

export function GoalCommandCenter({ goalId }: GoalCommandCenterProps) {
  const router = useRouter();
  const [data, setData] = useState<GoalBundle | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/goals/${goalId}`);
    const json = await res.json();
    if (res.ok) setData(json as GoalBundle);
    setLoading(false);
  }, [goalId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="h-64 skeleton-shimmer rounded-[10px]" />;
  if (!data) return <Card className="p-8 text-center text-text3">الهدف غير موجود</Card>;

  const { goal, completion, habits, tasks, books, timeBlocks, bodyMetrics } = data;
  const goalColor = areaColor(goal.area);
  const forecast = bodyMetrics
    ? buildWeightForecast(bodyMetrics.currentWeight, bodyMetrics.targetWeight, bodyMetrics.weeklyGain)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOTION.spring.soft}
      className="space-y-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-text3 mb-1">Goal Command Center</p>
          <h1 className="font-display text-2xl md:text-3xl font-black text-gold2 tracking-tight">{goal.title}</h1>
          <p className="text-sm text-text3 mt-1">{completion.probabilityText ?? "تتبّع التقدم والروابط"}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push("/goals")}>
          ← الأهداف
        </Button>
      </div>

      <BentoGrid>
        <BentoTile span="8" delay={0}>
          <Card className="p-5 h-full glass-premium border-gold/15">
            <div className="flex flex-wrap items-start gap-5">
              <ProgressRing
                value={completion.completionScore}
                size={88}
                color={goalColor}
                label="Completion"
                sublabel={`نجاح ${completion.successProbability}%`}
              />
              <div className="flex-1 min-w-[200px] space-y-3">
                <div className="flex flex-wrap gap-2">
                  {completion.atRisk && (
                    <span className="text-xs px-2 py-1 rounded-full bg-rose/20 text-rose2 border border-rose/30">
                      ⚠️ معرّض للخطر
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 rounded-full bg-surface2 border border-border text-text3">
                    تقدم الهدف {goal.progress ?? 0}%
                  </span>
                </div>
                {goal.why && <p className="text-sm text-text2 italic">&ldquo;{goal.why}&rdquo;</p>}
                {goal.description && <p className="text-xs text-text3">{goal.description}</p>}
              </div>
            </div>
          </Card>
        </BentoTile>

        <BentoTile span="4" delay={0.05}>
          <Card className="p-4 h-full gradient-emerald">
            <div className="text-xs text-text3 mb-2">الروابط</div>
            <div className="grid grid-cols-2 gap-3 text-center">
              {[
                { n: habits.length, label: "عادات" },
                { n: tasks.length, label: "مهام" },
                { n: books.length, label: "كتب" },
                { n: timeBlocks.length, label: "وقت" },
              ].map((item) => (
                <div key={item.label} className="p-2 rounded-xl bg-surface/40 border border-border/30">
                  <div className="text-xl font-black text-gold2">{item.n}</div>
                  <div className="text-[10px] text-text3">{item.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </BentoTile>

        {bodyMetrics && (
          <BentoTile span="6" delay={0.08}>
            <WeightVizCard
              current={bodyMetrics.currentWeight}
              target={bodyMetrics.targetWeight}
              progressPct={bodyMetrics.progressPct}
              weeklyRate={bodyMetrics.weeklyGain}
              trend="up"
              forecastDate={bodyMetrics.eta}
              history={[
                { label: "الحالي", value: bodyMetrics.currentWeight },
                ...forecast.slice(0, 1).map((p) => ({ label: p.label, value: p.value })),
              ]}
            />
          </BentoTile>
        )}

        <BentoTile span={bodyMetrics ? "6" : "12"} delay={0.1}>
          <LinkedListCard title="العادات المرتبطة" empty="لا عادات" href="/habits" hrefLabel="أضف" count={habits.length}>
            {habits.map((h) => (
              <div key={h.id} className="flex justify-between text-sm border-b border-border/40 pb-1.5 last:border-0">
                <span>{h.name}</span>
                <span className="text-text3">🔥 {h.streak ?? 0}</span>
              </div>
            ))}
          </LinkedListCard>
        </BentoTile>

        <BentoTile span="6" delay={0.12}>
          <LinkedListCard title="المهام" empty="لا مهام" href="/tasks" count={tasks.length}>
            {tasks.map((t) => (
              <div key={t.id} className="flex justify-between text-sm border-b border-border/40 pb-1.5 last:border-0">
                <span className={t.status === "done" ? "line-through text-text3" : ""}>{t.title}</span>
                <span className="text-[10px] text-text3">{t.status}</span>
              </div>
            ))}
          </LinkedListCard>
        </BentoTile>

        <BentoTile span="6" delay={0.14}>
          <LinkedListCard title="الكتب" empty="—" href="/books" count={books.length}>
            {books.map((b) => (
              <div key={b.id} className="flex justify-between text-sm border-b border-border/40 pb-1.5 last:border-0">
                <span>{b.title}</span>
                <span className="text-text3">{b.progress}%</span>
              </div>
            ))}
          </LinkedListCard>
        </BentoTile>
      </BentoGrid>

      <div className="flex flex-wrap gap-2">
        <Button variant="gold" onClick={() => router.push("/planner")}>📅 جدولة وقت</Button>
        <Button variant="ghost" onClick={() => router.push(`/areas/${goal.area}`)}>🗂️ المجال</Button>
        <Link href="/habits" className="text-xs text-gold2 self-center hover:underline">ربط عادة →</Link>
      </div>
    </motion.div>
  );
}

function LinkedListCard({
  title,
  children,
  empty,
  href,
  hrefLabel = "عرض",
  count,
}: {
  title: string;
  children: React.ReactNode;
  empty: string;
  href?: string;
  hrefLabel?: string;
  count: number;
}) {
  return (
    <Card className="p-4 h-full glass-premium space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-sm font-bold text-gold2">{title}</div>
        {href && (
          <Link href={href} className="text-[10px] text-gold2 hover:underline">{hrefLabel}</Link>
        )}
      </div>
      {count === 0 ? <div className="text-xs text-text3">{empty}</div> : <div className="space-y-1">{children}</div>}
    </Card>
  );
}
