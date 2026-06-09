import type { WeightLog } from "@/types/lifeos";

export function filterWeightTrend(logs: WeightLog[], days: number): WeightLog[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return logs.filter((l) => l.date >= cutoffStr);
}

export function trendDelta(logs: WeightLog[]): number | null {
  if (logs.length < 2) return null;
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  return Math.round((sorted[sorted.length - 1].weight - sorted[0].weight) * 10) / 10;
}
