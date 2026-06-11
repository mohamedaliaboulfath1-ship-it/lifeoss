"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedProgress } from "@/components/motion/animated-progress";
import { HabitCheck } from "@/components/motion/habit-check";
import { CountUp } from "@/components/ui/count-up";
import { today } from "@/lib/utils";
import type { DashboardHabitToday } from "@/types/lifeos-pro";
import Link from "next/link";
import { useLifeOS } from "@/contexts/lifeos-context";
import { useToast } from "@/contexts/toast-context";
import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";
import { AutoAnimateList } from "@/components/motion/auto-animate-list";
import { useAchievementOptional } from "@/contexts/achievement-context";

interface HabitsTodayProps {
  habits: DashboardHabitToday[];
  onHabitComplete?: () => void;
}

export function HabitsToday({ habits, onHabitComplete }: HabitsTodayProps) {
  const { refreshSilent } = useLifeOS();
  const { toast } = useToast();
  const celebrate = useAchievementOptional()?.celebrate;
  const [local, setLocal] = useState(habits);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setLocal(habits);
  }, [habits]);

  const done = local.filter((h) => h.done).length;
  const pct = local.length ? Math.round((done / local.length) * 100) : 0;

  async function toggle(habitId: string) {
    const prev = local.find((h) => h.id === habitId)?.done ?? false;
    setLocal((list) =>
      list.map((h) => (h.id === habitId ? { ...h, done: !prev } : h))
    );
    setBusy(habitId);
    try {
      const res = await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: today() }),
      });
      if (!res.ok) throw new Error("failed");
      if (!prev) {
        celebrate?.({
          kind: "habit",
          title: "عادة مكتملة!",
          subtitle: "استمر — أنت تبني زخمك",
        });
      }
      void refreshSilent();
    } catch {
      setLocal((list) =>
        list.map((h) => (h.id === habitId ? { ...h, done: prev } : h))
      );
      toast("تعذّر تحديث العادة", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="h-full glass-premium">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>🔄 Today&apos;s Habits</CardTitle>
        <motion.span
          key={pct}
          initial={{ opacity: 0.6, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: MOTION.duration.normal, ease: MOTION.ease.out }}
          className="text-xs font-mono text-gold2"
        >
          <CountUp value={done} />/{local.length} · <CountUp value={pct} suffix="%" />
        </motion.span>
      </CardHeader>
      <CardBody className="!py-2 space-y-2 max-h-64 overflow-y-auto">
        <AnimatedProgress value={pct} color="var(--emerald)" height="h-1" />
        {local.length === 0 ? (
          <p className="text-text3 text-sm py-4 text-center">
            لا عادات مطلوبة اليوم —{" "}
            <Link href="/habits" className="text-gold2 hover:underline">
              أضف عادة
            </Link>
          </p>
        ) : (
          <AutoAnimateList className="space-y-2">
            {local.map((h) => (
              <HabitCheck
                key={h.id}
                checked={h.done}
                disabled={busy === h.id}
                onChange={() => toggle(h.id)}
                onComplete={onHabitComplete}
                label={h.name}
                meta={h.scheduleLabel ?? h.timeOfDay}
              />
            ))}
          </AutoAnimateList>
        )}
      </CardBody>
    </Card>
  );
}
