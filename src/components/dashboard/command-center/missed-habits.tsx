"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardMissedHabit } from "@/types/lifeos-pro";
import { MOTION } from "@/lib/motion";

interface Props {
  habits: DashboardMissedHabit[];
}

export function MissedHabits({ habits }: Props) {
  if (!habits.length) return null;

  return (
    <Card className="h-full border-rose2/30 bg-rose2/5">
      <CardHeader>
        <CardTitle>⚠️ عادات فائتة</CardTitle>
        <span className="text-xs font-mono text-rose2">{habits.length}</span>
      </CardHeader>
      <CardBody className="!py-2 space-y-2 max-h-48 overflow-y-auto">
        {habits.map((h) => (
          <motion.div
            key={`${h.id}-${h.missedDate}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: MOTION.duration.normal, ease: MOTION.ease.out }}
          >
            <Link
              href="/habits"
              className="flex items-center justify-between p-2.5 rounded-xl bg-surface/60 border border-rose2/20 hover:border-rose2/50 transition-all text-sm"
            >
              <span className="font-medium">{h.name}</span>
              <span className="text-[10px] text-rose2 shrink-0">
                منذ {h.daysAgo} يوم · {h.scheduleLabel}
              </span>
            </Link>
          </motion.div>
        ))}
      </CardBody>
    </Card>
  );
}
