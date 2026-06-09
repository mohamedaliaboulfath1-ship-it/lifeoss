"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { MiniChart } from "@/components/ui/mini-chart";
import { filterWeightTrend, trendDelta } from "@/lib/body/weight-trends";
import type { WeightLog } from "@/types/lifeos";

const RANGES = [
  { id: 7, label: "7 أيام" },
  { id: 30, label: "30 يوم" },
  { id: 90, label: "90 يوم" },
] as const;

interface Props {
  logs: WeightLog[];
}

export function WeightTrendPanel({ logs }: Props) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const filtered = useMemo(() => filterWeightTrend(logs, range), [logs, range]);
  const delta = useMemo(() => trendDelta(filtered), [filtered]);
  const chartData = filtered.map((l) => ({ label: l.date.slice(5), value: l.weight }));

  return (
    <Card className="p-4 glass-premium">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold">Weight Trend</div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`text-[10px] px-2 py-1 rounded-full border ${
                range === r.id ? "border-gold text-gold2" : "border-border text-text3"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {delta != null && (
        <p className="text-xs text-text3 mb-2">
          التغيّر: <span className={delta >= 0 ? "text-emerald2" : "text-rose2"}>{delta >= 0 ? "+" : ""}{delta} كجم</span>
        </p>
      )}
      {chartData.length > 1 ? (
        <MiniChart data={chartData} type="line" color="var(--gold)" height={120} />
      ) : (
        <p className="text-text3 text-sm py-6 text-center">سجّل وزنين على الأقل لعرض الاتجاه</p>
      )}
    </Card>
  );
}
