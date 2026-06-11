"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { MOTION } from "@/lib/motion/transitions";
import { currentBlock, nextActivity, timeMetrics } from "@/lib/time/calendar-grid";
import { today } from "@/lib/utils";
import type { TimeBlock, UserTimeSettings } from "@/types/time";

interface FocusDashboardPanelProps {
  blocks: TimeBlock[];
  settings: UserTimeSettings | null;
}

export function FocusDashboardPanel({ blocks, settings }: FocusDashboardPanelProps) {
  const t = today();
  const metrics = useMemo(
    () => (settings ? timeMetrics(settings, t, blocks) : null),
    [settings, t, blocks]
  );
  const current = useMemo(() => currentBlock(blocks), [blocks]);
  const next = useMemo(() => nextActivity(blocks), [blocks]);

  const todayBlocks = useMemo(
    () =>
      blocks
        .filter((b) => b.startAt.slice(0, 10) === t)
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [blocks, t]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOTION.spring}
      className="grid md:grid-cols-2 xl:grid-cols-4 gap-3"
    >
      <Card className="p-4 gradient-indigo">
        <div className="text-[10px] text-text3 uppercase tracking-wider">التركيز الحالي</div>
        <div className="text-sm font-bold mt-1 truncate">
          {current ? current.title : "لا كتلة نشطة"}
        </div>
        {current && (
          <div className="text-[10px] text-text3 mt-1">
            {new Date(current.startAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
            {" → "}
            {new Date(current.endAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </Card>

      <Card className="p-4 gradient-blue">
        <div className="text-[10px] text-text3 uppercase tracking-wider">التالي</div>
        <div className="text-sm font-bold mt-1 truncate">
          {next ? next.title : "لا شيء مجدول"}
        </div>
        {next && (
          <div className="text-[10px] text-text3 mt-1">
            {new Date(next.startAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </Card>

      <Card className="p-4 gradient-emerald">
        <div className="text-[10px] text-text3 uppercase tracking-wider">استغلال الوقت</div>
        <div className="text-2xl font-black text-emerald mt-1">
          {metrics?.utilizationPct ?? 0}%
        </div>
        <div className="text-[10px] text-text3">
          Deep Work: {metrics?.deepWorkHours ?? 0}س
        </div>
      </Card>

      <Card className="p-4 gradient-orange">
        <div className="text-[10px] text-text3 uppercase tracking-wider">ميزانية اليوم</div>
        <div className="grid grid-cols-2 gap-1 text-[10px] mt-2">
          <span>متاح: <strong>{metrics?.availableHours ?? 0}س</strong></span>
          <span>مخطط: <strong>{metrics?.plannedHours ?? 0}س</strong></span>
          <span>حر: <strong>{metrics?.freeHours ?? 0}س</strong></span>
          <span>ضائع: <strong>{metrics?.lostHours ?? 0}س</strong></span>
        </div>
      </Card>

      <Card className="p-4 md:col-span-2 xl:col-span-4">
        <div className="text-xs font-bold text-gold2 mb-2">جدول اليوم ({todayBlocks.length})</div>
        <div className="flex flex-wrap gap-2">
          {todayBlocks.length === 0 ? (
            <span className="text-xs text-text3">لا كتل — أضف Time Block</span>
          ) : (
            todayBlocks.map((b) => (
              <span
                key={b.id}
                className="text-[10px] px-2 py-1 rounded-sm border border-border bg-surface2/80"
              >
                {new Date(b.startAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                {" "}{b.title}
              </span>
            ))
          )}
        </div>
      </Card>
    </motion.div>
  );
}
