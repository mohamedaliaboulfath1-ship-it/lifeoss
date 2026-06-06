import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardSnapshot } from "@/types/lifeos-pro";
import type { YearPayload } from "@/types/lifeos";
import { calcOverallHabitPct } from "@/lib/calculations";
import { isThisWeek, today } from "@/lib/utils";
import { loadCareerSummary } from "@/lib/dashboard/career";
import { buildActionableInsights } from "@/lib/dashboard/insights";
import { calcGoalProbability } from "@/lib/dashboard/goal-probability";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "☀️ صباح الخير";
  if (h < 18) return "🌤️ نهارك سعيد";
  return "🌙 مساء الخير";
}

function yearProgress(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);
  return Math.min(
    100,
    Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100)
  );
}

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function buildDashboardSnapshot(
  db: SupabaseClient,
  userId: string,
  profileName: string,
  yearData: YearPayload,
  profileExtras?: {
    startWeight?: number | null;
    targetWeight?: number | null;
    dailyCalories?: number;
    proteinTarget?: number;
    carbsTarget?: number;
    fatsTarget?: number;
    lifeStartDate?: string | null;
  }
): Promise<DashboardSnapshot> {
  const todayStr = today();
  const monthStartStr = monthStart();

  const [
    tasksRes,
    habitsRes,
    habitLogsRes,
    goalsRes,
    notifRes,
    mealRes,
    debtsRes,
    txMonthRes,
    profileRes,
    career,
  ] = await Promise.all([
    db
      .from("life_tasks")
      .select("id, title, priority, due_date, status")
      .eq("user_id", userId)
      .in("status", ["inbox", "active"])
      .or(`due_date.lte.${todayStr},due_date.is.null`)
      .order("priority", { ascending: true })
      .limit(15),
    db
      .from("habits")
      .select("id, name, frequency, active, category, time_of_day")
      .eq("user_id", userId)
      .eq("active", true),
    db
      .from("habit_logs")
      .select("habit_id, log_date, done")
      .eq("user_id", userId)
      .eq("log_date", todayStr),
    db
      .from("goals")
      .select("id, title, progress, status, target_date, due_date, area, category, created_at, priority")
      .eq("user_id", userId)
      .in("status", ["active", "paused"])
      .limit(30),
    db
      .from("notifications")
      .select("id, title, priority, type, action_url, domain_id")
      .eq("user_id", userId)
      .is("read_at", null)
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("meal_logs")
      .select("calories, protein, carbs, fats")
      .eq("user_id", userId)
      .eq("log_date", todayStr),
    db.from("debts").select("remaining_amount, status").eq("user_id", userId),
    db
      .from("transactions")
      .select("type, amount, tx_date")
      .eq("user_id", userId)
      .gte("tx_date", monthStartStr),
    db
      .from("profiles")
      .select("start_weight, target_weight, daily_calories, protein_target, carbs_target, fats_target, life_start_date, start_date")
      .eq("id", userId)
      .maybeSingle(),
    loadCareerSummary(db, userId),
  ]);

  const profile = profileRes.data;
  const startWeight = profile?.start_weight ?? profileExtras?.startWeight ?? null;
  const targetWeight = profile?.target_weight ?? profileExtras?.targetWeight ?? 75;
  const calorieTarget = profile?.daily_calories ?? profileExtras?.dailyCalories ?? 3000;
  const proteinTarget = profile?.protein_target ?? profileExtras?.proteinTarget ?? 130;
  const carbsTarget = profile?.carbs_target ?? profileExtras?.carbsTarget ?? 350;
  const fatsTarget = profile?.fats_target ?? profileExtras?.fatsTarget ?? 90;

  const dailyHabits = (habitsRes.data ?? []).filter(
    (h) => h.frequency === "daily" || !h.frequency || h.frequency === "daily"
  );
  const doneSet = new Set(
    (habitLogsRes.data ?? []).filter((l) => l.done).map((l) => l.habit_id)
  );

  const todayHabits = dailyHabits.map((h) => ({
    id: h.id,
    name: h.name,
    done: doneSet.has(h.id),
    category: h.category ?? undefined,
    timeOfDay: h.time_of_day ?? undefined,
  }));

  const habitsDone = todayHabits.filter((h) => h.done).length;
  const habitsPending = todayHabits.filter((h) => !h.done);

  const tasksDueToday = (tasksRes.data ?? [])
    .filter((t) => t.due_date && t.due_date <= todayStr)
    .slice(0, 8)
    .map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    dueDate: t.due_date ?? undefined,
    status: t.status,
  }));

  const goals = goalsRes.data ?? [];
  const atRiskGoals = goals
    .map((g) => {
      const prob = calcGoalProbability({
        progress: g.progress,
        target_date: g.target_date ?? g.due_date,
        created_at: g.created_at,
        status: g.status,
      });
      if (!prob || prob.label === "on_track" || prob.label === "ahead") return null;
      const targetDate = g.target_date ?? g.due_date;
      const daysLeft = targetDate
        ? Math.round((new Date(targetDate).getTime() - Date.now()) / 86400000)
        : undefined;
      if ((g.progress ?? 0) >= 40 && (daysLeft ?? 999) > 60) return null;
      return {
        id: g.id,
        title: g.title,
        progress: g.progress ?? 0,
        targetDate: targetDate ?? undefined,
        probabilityText: prob.text,
        probabilityClass: prob.className,
        daysLeft,
      };
    })
    .filter(Boolean) as DashboardSnapshot["atRiskGoals"];

  const priorities: DashboardSnapshot["priorities"] = [];
  let rank = 1;

  for (const t of tasksDueToday.filter((t) => t.priority === "p1").slice(0, 2)) {
    priorities.push({
      rank: rank++,
      type: "task",
      urgency: "urgent",
      title: t.title,
      subtitle: "P1 — مستحقة اليوم",
      actionUrl: "/tasks",
      entityId: t.id,
    });
  }
  for (const h of habitsPending.slice(0, 2)) {
    priorities.push({
      rank: rank++,
      type: "habit",
      urgency: "high",
      title: h.name,
      subtitle: "عادة اليوم",
      actionUrl: "/habits",
      entityId: h.id,
    });
  }
  for (const t of tasksDueToday.filter((t) => t.priority !== "p1").slice(0, 1)) {
    if (rank > 5) break;
    priorities.push({
      rank: rank++,
      type: "task",
      urgency: "high",
      title: t.title,
      subtitle: "مستحقة اليوم",
      actionUrl: "/tasks",
      entityId: t.id,
    });
  }
  for (const g of atRiskGoals.slice(0, 2)) {
    if (rank > 5) break;
    priorities.push({
      rank: rank++,
      type: "goal",
      urgency: "normal",
      title: g.title,
      subtitle: g.probabilityText,
      actionUrl: "/goals",
      entityId: g.id,
    });
  }
  for (const n of notifRes.data ?? []) {
    if (rank > 5) break;
    priorities.push({
      rank: rank++,
      type: "notification",
      urgency: (n.priority as DashboardSnapshot["priorities"][0]["urgency"]) ?? "normal",
      title: n.title,
      actionUrl: n.action_url ?? "/dashboard",
      entityId: n.id,
    });
  }

  const meals = mealRes.data ?? [];
  const nutrition = {
    calories: meals.reduce((s, m) => s + (m.calories ?? 0), 0),
    protein: meals.reduce((s, m) => s + (m.protein ?? 0), 0),
    carbs: meals.reduce((s, m) => s + (m.carbs ?? 0), 0),
    fats: meals.reduce((s, m) => s + (m.fats ?? 0), 0),
    calorieTarget,
    proteinTarget,
    carbsTarget,
    fatsTarget,
  };

  const wLogs = yearData.weightLogs ?? [];
  const currentWeight = wLogs.length ? wLogs[wLogs.length - 1].weight : startWeight;
  const weightProgressPct =
    currentWeight && startWeight && targetWeight && targetWeight !== startWeight
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((currentWeight - startWeight) / (targetWeight - startWeight)) * 100
            )
          )
        )
      : 0;

  const workoutLogs = (yearData.workoutLogs ?? []) as { date?: string }[];
  const weekLogs = workoutLogs.filter((w) => isThisWeek(w.date));
  const uniqueDays = new Set(weekLogs.map((w) => w.date)).size;

  const txs = txMonthRes.data ?? [];
  const monthIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthSavings = txs.filter((t) => t.type === "savings").reduce((s, t) => s + t.amount, 0);
  const totalSavings = (yearData.transactions ?? [])
    .filter((t) => t.type === "saving")
    .reduce((a, b) => a + b.amount, 0);

  const activeDebts = (debtsRes.data ?? []).filter((d) => d.status === "active");
  const debtRemaining = activeDebts.reduce((s, d) => s + (d.remaining_amount ?? 0), 0);

  const habitPct = calcOverallHabitPct(yearData);
  const avgGoalProgress = goals.length
    ? goals.reduce((s, g) => s + (g.progress ?? 0), 0) / goals.length
    : 0;
  const nutritionScore = nutrition.calories > 0
    ? Math.min(100, Math.round((nutrition.calories / calorieTarget) * 100))
    : 30;
  const workoutScore = Math.min(100, Math.round((uniqueDays / 5) * 100));
  const taskScore = tasksDueToday.length === 0 ? 95 : Math.max(40, 90 - tasksDueToday.length * 10);

  const lifeScore = Math.round(
    habitPct * 0.25 +
      avgGoalProgress * 0.2 +
      nutritionScore * 0.15 +
      workoutScore * 0.15 +
      taskScore * 0.1 +
      Math.min(100, (totalSavings / 12000) * 100) * 0.15
  );

  const insights = buildActionableInsights({
    habitsPending: habitsPending.length,
    habitsTotal: todayHabits.length,
    tasksDue: tasksDueToday.length,
    atRiskGoals: atRiskGoals.length,
    weekWorkouts: uniqueDays,
    weekWorkoutTarget: 5,
    todayCalories: nutrition.calories,
    calorieTarget,
    todayProtein: nutrition.protein,
    proteinTarget,
    savings: totalSavings,
    savingsTarget: 12000,
    latestWeight: currentWeight,
    targetWeight,
    learningHoursWeek: career.learningHoursWeek,
    careerTargetRole: career.targetRole,
  });

  const lifeStart = profile?.life_start_date ?? profile?.start_date;
  const daysFromStart = lifeStart
    ? Math.max(0, Math.round((Date.now() - new Date(lifeStart).getTime()) / 86400000))
    : 0;

  const snapshot: DashboardSnapshot = {
    greeting: `${greeting()}، ${profileName}`,
    subtitle:
      daysFromStart > 0
        ? `اليوم ${todayStr} · مرّ ${daysFromStart} يوم من بدء رحلتك · ${yearProgress()}% من السنة`
        : `اليوم ${todayStr} · ${yearProgress()}% من السنة`,
    dayProgress: yearProgress(),
    yearProgress: yearProgress(),
    priorities: priorities.slice(0, 5),
    todayHabits,
    tasksDueToday,
    atRiskGoals,
    weight: {
      current: currentWeight,
      start: startWeight,
      target: targetWeight,
      progressPct: weightProgressPct,
      changeFromStart:
        currentWeight && startWeight
          ? Math.round((currentWeight - startWeight) * 10) / 10
          : undefined,
    },
    nutrition,
    workouts: {
      weekSessions: weekLogs.length,
      weekTarget: 5,
      uniqueDays,
      lastSessionDate: weekLogs[0]?.date,
    },
    finance: {
      monthIncome,
      monthExpense,
      monthSavings,
      netMonth: monthIncome - monthExpense,
      totalSavings,
      activeDebts: activeDebts.length,
      debtRemaining,
    },
    career,
    insights,
    scores: {
      lifeScore,
      disciplineScore: habitPct,
      healthScore: workoutScore,
      financeScore: Math.min(100, Math.round((totalSavings / 12000) * 100)),
      learningScore: Math.min(100, Math.round((career.learningHoursWeek / 5) * 100)),
      careerScore: career.transformationProgress,
      factors: { habitPct, nutritionScore, workoutScore, avgGoalProgress },
    },
    counts: {
      tasksDueToday: tasksDueToday.length,
      habitsPendingToday: habitsPending.length,
      habitsDoneToday: habitsDone,
      goalsAtRisk: atRiskGoals.length,
      unreadNotifications: (notifRes.data ?? []).length,
    },
    domains: [
      {
        domainId: "domain_body",
        slug: "body",
        nameAr: "الجسد",
        icon: "💪",
        score: weightProgressPct,
        headline: currentWeight ? `${currentWeight} / ${targetWeight} كجم` : `هدف ${targetWeight} كجم`,
      },
      {
        domainId: "domain_finance",
        slug: "finance",
        nameAr: "المال",
        icon: "💰",
        headline: `${Math.round(monthIncome - monthExpense)} صافي الشهر`,
      },
      {
        domainId: "domain_career",
        slug: "career",
        nameAr: "المهنة",
        icon: "📈",
        headline: `${career.currentRole} → ${career.targetRole}`,
      },
      {
        domainId: "domain_learning",
        slug: "learning",
        nameAr: "التعلم",
        icon: "🧠",
        headline: `${career.learningHoursWeek}س / ${career.learningHoursTarget}س أسبوعياً`,
      },
    ],
  };

  try {
    await db.from("dashboard_snapshots").upsert({
      user_id: userId,
      greeting: snapshot.greeting,
      priorities: snapshot.priorities,
      snapshot: snapshot as unknown as Record<string, unknown>,
      computed_at: new Date().toISOString(),
    });
  } catch {
    /* table may not exist yet */
  }

  return snapshot;
}
