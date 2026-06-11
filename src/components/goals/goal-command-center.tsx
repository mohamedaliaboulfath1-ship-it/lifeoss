"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PageHeader } from "@/components/ui/page-header";
import { MOTION } from "@/lib/motion/transitions";
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={MOTION.spring}
      className="space-y-6"
    >
      <PageHeader
        title={`🎯 ${goal.title}`}
        subtitle={`Goal Command Center · ${completion.probabilityText ?? ""}`}
        actionLabel="← الأهداف"
        onAction={() => { window.location.href = "/goals"; }}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 gradient-indigo md:col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-text3">Completion Score</div>
              <div className="text-3xl font-black text-gold2">{completion.completionScore}%</div>
              <div className="text-sm text-text3 mt-1">احتمال النجاح: {completion.successProbability}%</div>
            </div>
            {completion.atRisk && (
              <span className="text-xs px-2 py-1 rounded-sm bg-rose/20 text-rose2 border border-rose/30">⚠️ معرّض للخطر</span>
            )}
          </div>
          <ProgressBar value={goal.progress ?? 0} color="var(--gold)" className="h-2 mt-3" />
        </Card>

        <Card className="p-4 gradient-emerald">
          <div className="text-xs text-text3">الروابط</div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div><strong>{habits.length}</strong> عادات</div>
            <div><strong>{tasks.length}</strong> مهام</div>
            <div><strong>{books.length}</strong> كتب</div>
            <div><strong>{timeBlocks.length}</strong> كتل وقت</div>
          </div>
        </Card>
      </div>

      {bodyMetrics && (
        <Card className="p-4 gradient-blue space-y-3">
          <div className="text-sm font-bold text-gold2">Body Transformation</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div><div className="text-[10px] text-text3">الحالي</div><div className="text-xl font-black">{bodyMetrics.currentWeight} كجم</div></div>
            <div><div className="text-[10px] text-text3">الهدف</div><div className="text-xl font-black">{bodyMetrics.targetWeight} كجم</div></div>
            <div><div className="text-[10px] text-text3">المتبقي</div><div className="text-xl font-black text-rose2">{bodyMetrics.remaining} كجم</div></div>
            <div><div className="text-[10px] text-text3">ETA</div><div className="text-sm font-bold">{bodyMetrics.eta ?? "—"}</div></div>
          </div>
          <div className="text-xs text-text3">متوسط الزيادة: +{bodyMetrics.weeklyGain} كجم/أسبوع</div>
          <Link href="/body" className="text-xs text-gold2 hover:underline">Body Coach →</Link>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-2">
          <div className="text-sm font-bold text-gold2">العادات المرتبطة</div>
          {habits.length === 0 ? <div className="text-xs text-text3">لا عادات — <Link href="/habits" className="text-gold2">أضف</Link></div> : habits.map((h) => (
            <div key={h.id} className="flex justify-between text-sm border-b border-border/40 pb-1">
              <span>{h.name}</span>
              <span className="text-text3">🔥 {h.streak ?? 0}</span>
            </div>
          ))}
        </Card>

        <Card className="p-4 space-y-2">
          <div className="text-sm font-bold text-gold2">المهام</div>
          {tasks.length === 0 ? <div className="text-xs text-text3">لا مهام</div> : tasks.map((t) => (
            <div key={t.id} className="flex justify-between text-sm border-b border-border/40 pb-1">
              <span className={t.status === "done" ? "line-through text-text3" : ""}>{t.title}</span>
              <span className="text-[10px] text-text3">{t.status}</span>
            </div>
          ))}
        </Card>

        <Card className="p-4 space-y-2">
          <div className="text-sm font-bold text-gold2">الكتب</div>
          {books.length === 0 ? <div className="text-xs text-text3">—</div> : books.map((b) => (
            <div key={b.id} className="flex justify-between text-sm border-b border-border/40 pb-1">
              <span>{b.title}</span>
              <span className="text-text3">{b.progress}%</span>
            </div>
          ))}
        </Card>

        <Card className="p-4 space-y-2">
          <div className="text-sm font-bold text-gold2">Time Blocks</div>
          {timeBlocks.length === 0 ? <div className="text-xs text-text3">— <Link href="/planner" className="text-gold2">جدولة</Link></div> : timeBlocks.map((b) => (
            <div key={b.id} className="flex justify-between text-sm border-b border-border/40 pb-1">
              <span>{b.title}</span>
              <span className="text-[10px] text-text3">{new Date(b.startAt).toLocaleDateString("ar-SA")}</span>
            </div>
          ))}
        </Card>
      </div>

      <div className="flex gap-2">
        <Button variant="gold" onClick={() => { window.location.href = "/planner"; }}>📅 جدولة وقت</Button>
        <Button variant="ghost" onClick={() => { window.location.href = `/areas/${goal.area}`; }}>🗂️ المجال</Button>
      </div>
    </motion.div>
  );
}
