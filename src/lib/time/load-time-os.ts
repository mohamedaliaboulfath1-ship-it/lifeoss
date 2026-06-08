import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimeOverviewPayload, TimeBlock, FocusSession, GoalTimeForecast } from "@/types/time";
import { loadTimeSettings } from "@/lib/time/settings";
import { calcDailyCapacity, calcWeeklyCapacity } from "@/lib/time/capacity";
import { calcFocusScore, buildHeatmap } from "@/lib/time/focus-score";
import { calcGoalTimeForecast } from "@/lib/time/goal-forecast";
import { mapTimeBlock } from "@/lib/time/blocks";
import { rescheduleBlock } from "@/lib/time/scheduler";
import { getWeekDates, today } from "@/lib/utils";

export async function loadTimeOverview(db: SupabaseClient, userId: string): Promise<TimeOverviewPayload> {
  const todayStr = today();
  const weekDates = getWeekDates(0);
  const monthStart = todayStr.slice(0, 7) + "-01";
  const yearStart = todayStr.slice(0, 4) + "-01-01";

  const settings = await loadTimeSettings(db, userId);

  const [blocksRes, focusRes, goalsRes] = await Promise.all([
    db.from("time_blocks").select("*").eq("user_id", userId).gte("start_at", weekDates[0]).lte("start_at", weekDates[6] + "T23:59:59"),
    db.from("focus_sessions").select("*").eq("user_id", userId).gte("started_at", weekDates[0]),
    db.from("goals").select("id, title, required_hours, logged_hours, target_date, domain_id").eq("user_id", userId).in("status", ["active"]),
  ]);

  const blocks = (blocksRes.data ?? []).map(mapTimeBlock);
  const blockRows = blocksRes.data ?? [];

  const focusSessions: FocusSession[] = (focusRes.data ?? []).map((s) => ({
    id: String(s.id),
    startedAt: String(s.started_at),
    endedAt: s.ended_at as string | undefined,
    durationMinutes: Number(s.duration_minutes),
    sessionType: s.session_type as FocusSession["sessionType"],
    domainId: s.domain_id as string | undefined,
    goalId: s.goal_id as string | undefined,
    taskId: s.task_id as string | undefined,
    timeBlockId: s.time_block_id as string | undefined,
    interrupted: Boolean(s.interrupted),
    focusScore: s.focus_score as number | undefined,
  }));

  const focusByDomain: Record<string, number> = {};
  for (const s of focusRes.data ?? []) {
    const dom = (s.domain_id as string) ?? "domain_self_dev";
    focusByDomain[dom] = (focusByDomain[dom] ?? 0) + Number(s.duration_minutes);
  }

  const todayCapacity = calcDailyCapacity(settings, todayStr, blockRows);
  const weeklyCapacity = calcWeeklyCapacity(settings, weekDates, blockRows, focusByDomain);

  const focusScore = calcFocusScore(blockRows, focusRes.data ?? []);

  const dailyMinutes: Record<string, number> = {};
  for (const b of blockRows) {
    const d = String(b.start_at).slice(0, 10);
    const mins = b.actual_minutes ?? Math.round((new Date(String(b.end_at)).getTime() - new Date(String(b.start_at)).getTime()) / 60000);
    if (b.status === "done") dailyMinutes[d] = (dailyMinutes[d] ?? 0) + mins;
  }
  for (const s of focusRes.data ?? []) {
    const d = String(s.started_at).slice(0, 10);
    dailyMinutes[d] = (dailyMinutes[d] ?? 0) + Number(s.duration_minutes);
  }

  const heatmapDays = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 27 + i);
    return d.toISOString().slice(0, 10);
  });
  const heatmap = buildHeatmap(dailyMinutes, heatmapDays);

  const goalForecasts: GoalTimeForecast[] = (goalsRes.data ?? [])
    .filter((g) => Number(g.required_hours) > 0)
    .map((g) =>
      calcGoalTimeForecast({
        id: String(g.id),
        title: String(g.title),
        requiredHours: Number(g.required_hours),
        loggedHours: Number(g.logged_hours),
        targetDate: g.target_date as string | undefined,
        weeklyPaceHours: 8,
      })
    );

  const utilizationPct =
    weeklyCapacity.totalAvailableHours > 0
      ? Math.round((weeklyCapacity.totalLoggedHours / weeklyCapacity.totalAvailableHours) * 100)
      : 0;

  const overcommitmentRisk: TimeOverviewPayload["overcommitmentRisk"] =
    weeklyCapacity.totalPlannedHours > weeklyCapacity.totalAvailableHours * 1.1
      ? "high"
      : weeklyCapacity.totalPlannedHours > weeklyCapacity.totalAvailableHours * 0.9
        ? "medium"
        : "low";

  const burnoutRisk: TimeOverviewPayload["burnoutRisk"] =
    weeklyCapacity.totalPlannedHours > weeklyCapacity.totalAvailableHours * 1.25 ? "high"
    : weeklyCapacity.totalPlannedHours > weeklyCapacity.totalAvailableHours ? "medium" : "low";

  const now = new Date();
  const missedBlocks = blocks.filter(
    (b) => b.status === "planned" && new Date(b.endAt) < now
  );

  const [yearFocusRes, monthFocusRes] = await Promise.all([
    db.from("focus_sessions").select("duration_minutes").eq("user_id", userId).gte("started_at", yearStart),
    db.from("focus_sessions").select("duration_minutes").eq("user_id", userId).gte("started_at", monthStart),
  ]);

  const sumMins = (rows: { duration_minutes: number }[]) =>
    Math.round(rows.reduce((s, r) => s + Number(r.duration_minutes), 0) / 60 * 10) / 10;

  return {
    settings,
    todayCapacity,
    weeklyCapacity,
    allocations: weeklyCapacity.byDomain,
    focusScore,
    deepWorkHours: {
      week: sumMins(focusRes.data ?? []),
      month: sumMins(monthFocusRes.data ?? []),
      year: sumMins(yearFocusRes.data ?? []),
    },
    heatmap,
    goalForecasts,
    burnoutRisk,
    overcommitmentRisk,
    utilizationPct,
    missedBlocks,
  };
}

export async function loadPlannerBlocks(
  db: SupabaseClient,
  userId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<TimeBlock[]> {
  const { data } = await db
    .from("time_blocks")
    .select("*")
    .eq("user_id", userId)
    .gte("start_at", rangeStart)
    .lte("start_at", rangeEnd + "T23:59:59")
    .order("start_at");
  return (data ?? []).map(mapTimeBlock);
}

export async function autoRescheduleMissed(
  db: SupabaseClient,
  userId: string,
  settings: Awaited<ReturnType<typeof loadTimeSettings>>
): Promise<number> {
  const now = new Date().toISOString();
  const { data: missed } = await db
    .from("time_blocks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "planned")
    .lt("end_at", now);

  const { data: existing } = await db
    .from("time_blocks")
    .select("start_at, end_at")
    .eq("user_id", userId)
    .gte("start_at", today());

  let count = 0;
  for (const block of missed ?? []) {
    const duration =
      block.estimated_minutes ??
      Math.round((new Date(String(block.end_at)).getTime() - new Date(String(block.start_at)).getTime()) / 60000);
    const slot = rescheduleBlock(settings, existing ?? [], duration);
    if (!slot) continue;
    await db
      .from("time_blocks")
      .update({
        status: "rescheduled",
        start_at: slot.startAt,
        end_at: slot.endAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", block.id);
    count++;
  }
  return count;
}
