"use client";

import type { TimeHeatmapCell } from "@/types/time";

interface Props {
  cells: TimeHeatmapCell[];
}

const LEVELS = ["bg-surface2/40", "bg-gold/15", "bg-gold/30", "bg-gold/50", "bg-gold/80"];

export function TimeHeatmap({ cells }: Props) {
  const weeks: TimeHeatmapCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="space-y-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex gap-1">
          {week.map((c) => (
            <div
              key={c.date}
              title={`${c.date}: ${c.minutes} د`}
              className={`w-4 h-4 rounded-sm ${LEVELS[c.level]} border border-border/30`}
            />
          ))}
        </div>
      ))}
      <div className="flex justify-between text-[10px] text-text3 mt-2">
        <span>أقل</span>
        <span>أكثر إنتاجية</span>
      </div>
    </div>
  );
}
