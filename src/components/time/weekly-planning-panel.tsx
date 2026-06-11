"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { calcWeeklyCapacity } from "@/lib/time/capacity";
import type { TimeBlock, UserTimeSettings } from "@/types/time";

interface WeeklyPlanningPanelProps {
  weekDates: string[];
  blocks: TimeBlock[];
  settings: UserTimeSettings | null;
}

export function WeeklyPlanningPanel({ weekDates, blocks, settings }: WeeklyPlanningPanelProps) {
  const capacity = useMemo(() => {
    if (!settings) return null;
    const blockRows = blocks.map((b) => ({
      start_at: b.startAt,
      end_at: b.endAt,
      status: b.status,
      domain_id: b.domainId ?? null,
      actual_minutes: b.actualMinutes ?? null,
    }));
    return calcWeeklyCapacity(settings, weekDates, blockRows, {});
  }, [settings, weekDates, blocks]);

  if (!capacity) return null;

  const budgetPct = capacity.totalAvailableHours > 0
    ? Math.round((capacity.totalPlannedHours / capacity.totalAvailableHours) * 100)
    : 0;

  return (
    <Card className="p-4 gradient-purple space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="text-sm font-bold">تخطيط أسبوعي — Time Budget</div>
        <div className="text-xs text-text3">
          {capacity.weekStart} → {weekDates[6]}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <div>
          <div className="text-[10px] text-text3">متاح</div>
          <div className="text-lg font-black">{capacity.totalAvailableHours}س</div>
        </div>
        <div>
          <div className="text-[10px] text-text3">مخطط</div>
          <div className="text-lg font-black text-sky">{capacity.totalPlannedHours}س</div>
        </div>
        <div>
          <div className="text-[10px] text-text3">منفّذ</div>
          <div className="text-lg font-black text-emerald">{capacity.totalLoggedHours}س</div>
        </div>
        <div>
          <div className="text-[10px] text-text3">الميزانية</div>
          <div className="text-lg font-black text-gold2">{budgetPct}%</div>
        </div>
      </div>

      <ProgressBar value={Math.min(100, budgetPct)} color="var(--purple)" className="h-2" />

      {capacity.byDomain.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-text3 font-bold">توزيع حسب المجال</div>
          {capacity.byDomain.slice(0, 5).map((d) => (
            <div key={d.domainId} className="flex items-center gap-2 text-[10px]">
              <span className="w-20 truncate">{d.nameAr}</span>
              <div className="flex-1 h-1.5 rounded-full bg-surface2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${d.plannedPct}%`, background: d.color }}
                />
              </div>
              <span className="text-text3 w-8">{d.plannedPct}%</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
