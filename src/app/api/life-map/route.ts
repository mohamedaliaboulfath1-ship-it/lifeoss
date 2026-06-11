import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { calcAdherence, calcBestStreak } from "@/lib/habits/intelligence";
import { buildGlobalLifeMap } from "@/lib/life-map/build-global-graph";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const { supabase, userId } = auth;
  const [
    goalsRes,
    tasksRes,
    habitsRes,
    habitLogsRes,
    booksRes,
    skillsRes,
    coursesRes,
    certsRes,
    pathsRes,
    resourcesRes,
    habitLinksRes,
    weightRes,
    profileRes,
    txRes,
    debtsRes,
  ] = await Promise.all([
    supabase
      .from("goals")
      .select("id, title, level, parent_id, progress, status, domain_id, area, category, description")
      .eq("user_id", userId)
      .in("status", ["active", "paused", "done"]),
    supabase
      .from("life_tasks")
      .select("id, title, goal_id, status, domain_id")
      .eq("user_id", userId)
      .in("status", ["inbox", "active", "done"]),
    supabase.from("habits").select("id, name, goal_id, project_id, domain_id, active_days").eq("user_id", userId).eq("active", true),
    supabase.from("habit_logs").select("habit_id, log_date, done").eq("user_id", userId),
    supabase
      .from("books")
      .select("id, title, goal_id, domain_id, pages_read, pages_total, status")
      .eq("user_id", userId)
      .in("status", ["planned", "reading", "done"]),
    supabase.from("skills").select("id, name, linked_goal_id, domain_id, current_level, target_level").eq("user_id", userId),
    supabase
      .from("courses")
      .select("id, title, linked_goal_id, domain_id, hours_completed, total_hours, status")
      .eq("user_id", userId)
      .in("status", ["active", "planned", "done"]),
    supabase
      .from("certifications")
      .select("id, name, linked_goal_id, domain_id, status")
      .eq("user_id", userId),
    supabase.from("learning_paths").select("id, title, progress").eq("user_id", userId),
    supabase.from("para_resources").select("id, title, domain_id, resource_type").eq("user_id", userId),
    supabase.from("goal_habit_links").select("goal_id, habit_id").eq("user_id", userId),
    supabase
      .from("weight_logs")
      .select("id, weight, log_date")
      .eq("user_id", userId)
      .order("log_date", { ascending: true })
      .limit(30),
    supabase.from("profiles").select("current_weight, target_weight").eq("id", userId).maybeSingle(),
    supabase.from("transactions").select("amount, type").eq("user_id", userId),
    supabase.from("debts").select("total, paid").eq("user_id", userId),
  ]);

  if (goalsRes.error) {
    return NextResponse.json({ error: goalsRes.error.message }, { status: 500 });
  }

  const logsMap: Record<string, Record<string, boolean>> = {};
  for (const l of habitLogsRes.data ?? []) {
    if (!logsMap[l.habit_id]) logsMap[l.habit_id] = {};
    logsMap[l.habit_id][l.log_date] = l.done;
  }

  const habitsWithAdherence = (habitsRes.data ?? []).map((h) => {
    const activeDays = Array.isArray(h.active_days) ? (h.active_days as number[]) : [0, 1, 2, 3, 4, 5, 6];
    const adherence = calcAdherence(h.id, logsMap, activeDays, 30);
    const streak = calcBestStreak(h.id, logsMap);
    return { ...h, adherence, streak };
  });

  const txs = txRes.data ?? [];
  const savings = txs.filter((t) => t.type === "saving").reduce((s, t) => s + t.amount, 0);
  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const debts = (debtsRes.data ?? []).reduce((s, d) => s + Math.max(0, d.total - d.paid), 0);
  const netWorth = savings + income - expense - debts;

  const map = buildGlobalLifeMap({
    goals: goalsRes.data ?? [],
    tasks: tasksRes.data ?? [],
    habits: habitsWithAdherence,
    books: (booksRes.data ?? []).map((b) => ({
      id: b.id,
      title: b.title,
      goal_id: b.goal_id,
      domain_id: b.domain_id,
      status: b.status,
      cur_page: b.pages_read,
      pages: b.pages_total,
    })),
    skills: (skillsRes.data ?? []).map((s) => ({
      ...s,
      progress: s.target_level ? Math.round((s.current_level / s.target_level) * 100) : undefined,
    })),
    courses: (coursesRes.data ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      linked_goal_id: c.linked_goal_id,
      domain_id: c.domain_id,
      status: c.status,
      progress: c.total_hours
        ? Math.round((c.hours_completed / c.total_hours) * 100)
        : undefined,
    })),
    certs: (certsRes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      linked_goal_id: c.linked_goal_id,
      domain_id: c.domain_id,
      status: c.status === "passed" ? "done" : c.status,
      progress_pct: c.status === "passed" ? 100 : c.status === "studying" ? 50 : 10,
    })),
    learningPaths: pathsRes.data ?? [],
    resources: resourcesRes.data ?? [],
    habitLinks: habitLinksRes.data ?? [],
    weightLogs: weightRes.data ?? [],
    profile: profileRes.data ?? undefined,
    financeSummary: { netWorth, savings, debts },
  });

  return NextResponse.json(map);
}
