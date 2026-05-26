import { computeYearMetrics, type YearMetrics } from "@/lib/archive/metrics";
import { getOrCreateLifeYear } from "@/lib/year-data";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function createYearSnapshot(
  supabase: SupabaseClient,
  userId: string,
  year: string,
  label?: string
) {
  const { data: yearData, record } = await getOrCreateLifeYear(userId, year);
  const metrics = computeYearMetrics(year, yearData);

  const { error: snapError } = await supabase.from("yearly_snapshots").upsert(
    {
      user_id: userId,
      year,
      label: label ?? `أرشيف ${year}`,
      payload: yearData as unknown as Record<string, unknown>,
    },
    { onConflict: "user_id,year" }
  );
  if (snapError) throw snapError;

  const { error: sumError } = await supabase.from("yearly_summaries").upsert(
    {
      user_id: userId,
      year,
      metrics: metrics as unknown as Record<string, unknown>,
    },
    { onConflict: "user_id,year" }
  );
  if (sumError) throw sumError;

  return { metrics, archivedAt: record.updated_at };
}

export type { YearMetrics };
