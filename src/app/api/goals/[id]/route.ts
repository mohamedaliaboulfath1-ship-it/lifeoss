import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { calcGoalCompletionScore } from "@/lib/goals/completion";
import { weightForecast } from "@/lib/body/weight-forecast";
import type { Goal, Habit } from "@/types/lifeos";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const { supabase, userId } = auth;

  const [goalRes, habitsRes, tasksRes, booksRes, blocksRes, profileRes, measureRes, photosRes] =
    await Promise.all([
      supabase.from("goals").select("*").eq("id", id).eq("user_id", userId).maybeSingle(),
      supabase.from("habits").select("*").eq("user_id", userId).eq("goal_id", id),
      supabase.from("life_tasks").select("*").eq("user_id", userId).eq("goal_id", id),
      supabase.from("books").select("*").eq("user_id", userId).eq("goal_id", id),
      supabase.from("time_blocks").select("*").eq("user_id", userId).eq("goal_id", id).order("start_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("current_weight, target_weight, start_weight, metadata").eq("id", userId).maybeSingle(),
      supabase.from("body_measurements").select("*").eq("user_id", userId).order("measure_date", { ascending: false }).limit(5),
      supabase.from("progress_photos").select("*").eq("user_id", userId).order("photo_date", { ascending: false }).limit(6),
    ]);

  if (goalRes.error) return NextResponse.json({ error: goalRes.error.message }, { status: 500 });
  if (!goalRes.data) return NextResponse.json({ error: "الهدف غير موجود" }, { status: 404 });

  const g = goalRes.data;
  const goal: Goal = {
    id: g.id,
    title: g.title,
    area: g.area,
    priority: g.priority ?? "med",
    status: g.status,
    progress: g.progress ?? 0,
    category: g.category ?? undefined,
    description: g.description ?? undefined,
    why: g.why ?? undefined,
    target: g.target_value ?? undefined,
    current: g.current_value ?? undefined,
    unit: g.unit ?? undefined,
    targetDate: g.target_date ?? undefined,
    due: g.due_date ?? undefined,
    domainId: g.domain_id ?? undefined,
    createdAt: g.created_at,
  };

  const habits: Habit[] = (habitsRes.data ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    cat: h.cat ?? "",
    freq: h.frequency ?? "daily",
    goalLink: h.goal_id ?? undefined,
    streak: h.streak ?? 0,
    bestStreak: h.best_streak ?? 0,
  }));

  const tasks = (tasksRes.data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.due_date,
    goalId: t.goal_id,
  }));

  const books = (booksRes.data ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    progress: b.progress ?? 0,
    status: b.status,
  }));

  const timeBlocks = (blocksRes.data ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    startAt: b.start_at,
    endAt: b.end_at,
    status: b.status,
  }));

  const { data: habitLogs } = await supabase
    .from("habit_logs")
    .select("habit_id, log_date, done")
    .eq("user_id", userId);

  const logs: Record<string, Record<string, boolean>> = {};
  for (const row of habitLogs ?? []) {
    if (!logs[row.habit_id]) logs[row.habit_id] = {};
    logs[row.habit_id][row.log_date] = row.done;
  }

  const linkedTaskDone = tasks.filter((t) => t.status === "done").length;
  const completion = calcGoalCompletionScore({
    goal,
    linkedHabits: habits,
    logs,
    linkedTaskDone,
    linkedTaskTotal: tasks.length,
  });

  const profile = profileRes.data;
  const meta = (profile?.metadata as Record<string, unknown> | null) ?? {};
  const bodyPlan = meta.bodyPlan as { weeklyGainTarget?: number } | undefined;

  let bodyMetrics: Record<string, unknown> | null = null;
  if (goal.area === "body" || goal.category === "body") {
    const current = profile?.current_weight ?? parseFloat(goal.current ?? "0");
    const target = profile?.target_weight ?? parseFloat(goal.target ?? "0");
    const forecast = weightForecast({
      current,
      target,
      start: profile?.start_weight ?? current,
      weeklyRate: bodyPlan?.weeklyGainTarget ?? 0.4,
    });
    bodyMetrics = {
      currentWeight: current,
      targetWeight: target,
      remaining: forecast.remaining,
      weeklyGain: forecast.weeklyRateUsed,
      eta: forecast.forecastDate ?? undefined,
      progressPct: forecast.progressPct,
    };
  }

  return NextResponse.json({
    goal,
    completion,
    habits,
    tasks,
    books,
    timeBlocks,
    bodyMetrics,
    measurements: (measureRes.data ?? []).map((m) => ({
      date: m.measure_date,
      chest: m.chest,
      waist: m.waist,
      arm: m.arm,
    })),
    progressPhotos: (photosRes.data ?? []).map((p) => ({
      date: p.photo_date,
      angle: p.photo_angle,
      weight: p.weight,
    })),
  });
}
