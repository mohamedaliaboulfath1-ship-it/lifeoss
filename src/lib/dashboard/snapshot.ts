import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardSnapshot } from "@/types/lifeos-pro";
import type { YearPayload } from "@/types/lifeos";
import { calcOverallHabitPct } from "@/lib/calculations";
import { isThisWeek, today } from "@/lib/utils";
import { loadCareerSummary } from "@/lib/dashboard/career";
import { buildActionableInsights } from "@/lib/dashboard/insights";
import { buildWealthCoachInsights, wealthCoachToDashboardInsights } from "@/lib/wealth/coach-insights";
import { subscriptionMonthlyEquivalent } from "@/lib/wealth/categories";
import { budgetAlertLevel } from "@/lib/wealth/snapshot";
import { enrichHabit } from "@/lib/habits/intelligence";
import { formatScheduleLabel, getMissedHabits, isHabitDueOnDate } from "@/lib/habits/schedule";
import { calcGoalCompletionScore } from "@/lib/goals/completion";
import { buildHabitCoachInsights } from "@/lib/life-coach/habit-coach";
import { buildBodyAnalytics } from "@/lib/body/analytics";
import { buildBodyCoachInsights } from "@/lib/body/coach";
import { resolveCurrentWeight } from "@/lib/body/weight-forecast";
import { calcGoalProbability } from "@/lib/dashboard/goal-probability";
import { computeUnifiedCareerScore } from "@/lib/career/score";

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

const TASK_PRIO: Record<string, number> = { p1: 0, p2: 1, p3: 2, p4: 3 };

function taskPriorityRank(p?: string | null) {
  return TASK_PRIO[p ?? "p3"] ?? 2;
}

type SnapshotHabitRow = {
  id: string;
  name: string;
  frequency?: string | null;
  frequency_type?: string | null;
  frequency_value?: Record<string, unknown> | null;
  active?: boolean;
  category?: string | null;
  time_of_day?: string | null;
  cat?: string | null;
  freq?: string | null;
  goal_id?: string | null;
  project_id?: string | null;
  domain_id?: string | null;
  why?: string | null;
  stop_impact?: string | null;
  priority?: string | null;
  impact?: string | null;
  active_days?: number[] | null;
  life_score_weight?: number | null;
  best_streak?: number | null;
};

function habitsFromYearData(habits: YearPayload["habits"]): SnapshotHabitRow[] {
  return (habits ?? [])
    .filter((h) => h.active !== false)
    .map((h) => ({
      id: h.id,
      name: h.name,
      frequency: h.freq,
      frequency_type: h.frequencyType,
      frequency_value: h.frequencyValue as Record<string, unknown> | null,
      active: h.active,
      category: h.cat,
      time_of_day: h.time,
      cat: h.cat,
      freq: h.freq,
      goal_id: h.goalLink,
      project_id: h.projectId,
      domain_id: h.domainId,
      why: h.why,
      stop_impact: h.stopImpact,
      priority: h.priority,
      impact: h.impact,
      active_days: h.activeDays,
      life_score_weight: h.lifeScoreWeight,
      best_streak: h.bestStreak,
    }));
}

function goalsFromYearData(goals: YearPayload["goals"]) {
  return (goals ?? [])
    .filter((g) => g.status === "active" || g.status === "paused")
    .slice(0, 30)
    .map((g) => ({
      id: g.id,
      title: g.title,
      progress: g.progress,
      status: g.status,
      target_date: g.targetDate,
      due_date: g.due,
      area: g.area,
      category: g.category,
      created_at: g.createdAt,
      priority: g.priority,
      level: g.level,
      parent_id: g.parentId,
      tasks: g.tasks,
    }));
}

function tasksFromYearData(
  tasks: YearPayload["tasks"],
  todayStr: string,
  weekLater: string
) {
  const active = (tasks ?? []).filter((t) => t.status === "inbox" || t.status === "active");
  const dueToday = active
    .filter((t) => !t.dueDate || t.dueDate <= todayStr)
    .sort((a, b) => taskPriorityRank(a.priority) - taskPriorityRank(b.priority))
    .slice(0, 15)
    .map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority ?? "p3",
      due_date: t.dueDate ?? null,
      status: t.status,
    }));
  const dueSoon = active
    .filter((t) => t.dueDate && t.dueDate > todayStr && t.dueDate <= weekLater)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority ?? "p3",
      due_date: t.dueDate ?? null,
      status: t.status,
    }));
  return { dueToday, dueSoon };
}

export async function buildDashboardSnapshot(
  db: SupabaseClient,
  userId: string,
  profileName: string,
  yearData: YearPayload,
  profileExtras?: {
    startWeight?: number | null;
    targetWeight?: number | null;
    currentWeight?: number | null;
    height?: number | null;
    dailyCalories?: number;
    proteinTarget?: number;
    carbsTarget?: number;
    fatsTarget?: number;
    lifeStartDate?: string | null;
    salary?: number | null;
    cashBalance?: number | null;
  }
): Promise<DashboardSnapshot> {
  const todayStr = today();
  const monthStartStr = monthStart();
  const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const { dueToday: tasksDueTodayRows, dueSoon: tasksDueSoonRows } = tasksFromYearData(
    yearData.tasks,
    todayStr,
    weekLater
  );
  const activeHabitRows = habitsFromYearData(yearData.habits);
  const goals = goalsFromYearData(yearData.goals);
  const logsMap = yearData.habitLogs ?? {};
  const mealsToday = (yearData.mealLogs ?? []).filter((m) => m.date === todayStr);
  const txsMonth = (yearData.transactions ?? [])
    .filter((t) => t.date >= monthStartStr)
    .map((t) => ({
      type: t.type === "saving" ? "savings" : t.type,
      amount: t.amount,
      tx_date: t.date,
      category: t.cat,
    }));
  const debtRemaining = (yearData.debts ?? []).reduce(
    (sum, d) => sum + Math.max(0, d.total - d.paid),
    0
  );
  const activeDebts = (yearData.debts ?? []).filter((d) => d.total - d.paid > 0);

  const [notifRes, career, subsRes, catRes, photosRes] = await Promise.all([
    db
      .from("notifications")
      .select("id, title, priority, type, action_url, domain_id")
      .eq("user_id", userId)
      .is("read_at", null)
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    loadCareerSummary(db, userId),
    db.from("subscriptions").select("name, price, billing_cycle, renewal_date").eq("user_id", userId).eq("active", true),
    db.from("expense_categories").select("name, monthly_budget").eq("user_id", userId),
    db.from("progress_photos").select("id").eq("user_id", userId).limit(1),
  ]);

  const profile = profileExtras
    ? {
        start_weight: profileExtras.startWeight,
        target_weight: profileExtras.targetWeight,
        current_weight: profileExtras.currentWeight,
        height: profileExtras.height,
        daily_calories: profileExtras.dailyCalories,
        protein_target: profileExtras.proteinTarget,
        carbs_target: profileExtras.carbsTarget,
        fats_target: profileExtras.fatsTarget,
        life_start_date: profileExtras.lifeStartDate,
        start_date: profileExtras.lifeStartDate,
        salary: profileExtras.salary,
        cash_balance: profileExtras.cashBalance,
      }
    : null;
  const startWeight = profile?.start_weight ?? profileExtras?.startWeight ?? null;
  const targetWeight = profile?.target_weight ?? profileExtras?.targetWeight ?? 75;
  const calorieTarget = profile?.daily_calories ?? profileExtras?.dailyCalories ?? 3000;
  const proteinTarget = profile?.protein_target ?? profileExtras?.proteinTarget ?? 130;
  const carbsTarget = profile?.carbs_target ?? profileExtras?.carbsTarget ?? 350;
  const fatsTarget = profile?.fats_target ?? profileExtras?.fatsTarget ?? 90;

  const activeHabits = activeHabitRows;
  const dueTodayHabits = activeHabits.filter((h) =>
    isHabitDueOnDate(
      {
        id: h.id,
        frequencyType: h.frequency_type,
        frequencyValue: h.frequency_value,
        activeDays: h.active_days as number[] | undefined,
        freq: h.freq ?? h.frequency ?? undefined,
      },
      todayStr,
      logsMap
    )
  );

  const todayHabits = dueTodayHabits.map((h) => ({
    id: h.id,
    name: h.name,
    done: Boolean(logsMap[h.id]?.[todayStr]),
    category: h.category ?? undefined,
    timeOfDay: h.time_of_day ?? undefined,
    scheduleLabel: formatScheduleLabel({
      frequencyType: h.frequency_type,
      frequencyValue: h.frequency_value,
      activeDays: h.active_days as number[] | undefined,
    }),
  }));

  const habitsDone = todayHabits.filter((h) => h.done).length;
  const habitsPending = todayHabits.filter((h) => !h.done);

  const missedHabits = getMissedHabits(
    activeHabits.map((h) => ({
      id: h.id,
      name: h.name,
      frequencyType: h.frequency_type,
      frequencyValue: h.frequency_value,
      activeDays: h.active_days as number[] | undefined,
      active: h.active !== false,
    })),
    logsMap
  ).map((m) => ({
    id: m.habitId,
    name: m.name,
    missedDate: m.missedDate,
    daysAgo: m.daysAgo,
    scheduleLabel: m.scheduleLabel,
  }));

  const mapTask = (t: {
    id: string;
    title: string;
    priority: string | null;
    due_date: string | null;
    status: string;
  }) => ({
    id: t.id,
    title: t.title,
    priority: t.priority ?? "p3",
    dueDate: t.due_date ?? undefined,
    status: t.status,
  });

  const tasksDueToday = tasksDueTodayRows
    .filter((t) => t.due_date && t.due_date <= todayStr)
    .slice(0, 8)
    .map(mapTask);

  const tasksDueSoon = tasksDueSoonRows.map(mapTask);
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
  for (const m of missedHabits.slice(0, 1)) {
    priorities.push({
      rank: rank++,
      type: "habit",
      urgency: "urgent",
      title: m.name,
      subtitle: `فاتت منذ ${m.daysAgo} يوم`,
      actionUrl: "/habits",
      entityId: m.id,
    });
  }
  for (const h of habitsPending.slice(0, 2)) {
    priorities.push({
      rank: rank++,
      type: "habit",
      urgency: "high",
      title: h.name,
      subtitle: h.scheduleLabel ?? "عادة اليوم",
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

  const meals = mealsToday;
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
  const currentWeight = resolveCurrentWeight({
    latestLog: wLogs.length ? wLogs[wLogs.length - 1].weight : null,
    profileCurrent: profile?.current_weight,
  });
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

  const txs = txsMonth;
  const monthIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthSavings = txs.filter((t) => t.type === "savings").reduce((s, t) => s + t.amount, 0);
  const totalSavings = (yearData.transactions ?? [])
    .filter((t) => t.type === "saving")
    .reduce((a, b) => a + b.amount, 0);

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

  const profileSalary = profile?.salary ?? 0;
  const incomeBase = monthIncome || profileSalary;
  const savingsRate = incomeBase > 0 ? Math.round((monthSavings / incomeBase) * 100) : 0;
  const subscriptionMonthly = (subsRes.data ?? []).reduce(
    (s, sub) => s + subscriptionMonthlyEquivalent(sub.price, sub.billing_cycle),
    0
  );
  const spendByCat: Record<string, number> = {};
  for (const t of txs.filter((t) => t.type === "expense")) {
    const cat = t.category ?? "أخرى";
    spendByCat[cat] = (spendByCat[cat] ?? 0) + t.amount;
  }
  const dayOfMonth = new Date().getDate();
  const budgetAlerts = (catRes.data ?? [])
    .filter((c) => c.monthly_budget && c.monthly_budget > 0)
    .map((c) => {
      const spent = spendByCat[c.name] ?? 0;
      const budget = c.monthly_budget!;
      const pct = Math.round((spent / budget) * 100);
      return {
        category: c.name,
        spent,
        budget,
        pct,
        level: budgetAlertLevel(pct, dayOfMonth),
      };
    });
  let nearestRenewal: { name: string; date: string; daysLeft: number } | undefined;
  for (const sub of subsRes.data ?? []) {
    if (!sub.renewal_date) continue;
    const days = Math.round((new Date(sub.renewal_date).getTime() - Date.now()) / 86400000);
    if (!nearestRenewal || days < nearestRenewal.daysLeft) {
      nearestRenewal = { name: sub.name, date: sub.renewal_date, daysLeft: days };
    }
  }
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const weightMonthAgo = wLogs.find((w) => w.date >= monthAgo)?.weight;
  const weightChangeMonth =
    weightMonthAgo && currentWeight ? currentWeight - weightMonthAgo : null;

  const baseInsights = buildActionableInsights({
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
    weightChangeMonth,
    bodyPhotosCount: photosRes.data?.length ?? 0,
  });
  const wealthInsights = wealthCoachToDashboardInsights(
    buildWealthCoachInsights({
      savingsRate,
      subscriptionMonthly,
      monthlyIncome: incomeBase,
      debts: debtRemaining,
      savings: totalSavings,
      budgetAlerts,
      nearestRenewal,
    })
  );

  const habitLogsMap = logsMap;
  const goalsMap = new Map(goals.map((g) => [g.id, {
    id: g.id, title: g.title, level: g.level, parentId: g.parent_id,
    progress: g.progress, status: g.status, targetDate: g.target_date ?? g.due_date,
    due: g.due_date, createdAt: g.created_at, tasks: g.tasks as { id: string; text: string; done: boolean }[] | undefined,
  }]));
  const enrichedHabits = activeHabitRows.map((h) =>
    enrichHabit(
      {
        id: h.id, name: h.name, cat: h.cat ?? h.category ?? "prod", freq: h.freq ?? h.frequency ?? "daily",
        goalLink: h.goal_id ?? undefined, projectId: h.project_id ?? undefined, domainId: h.domain_id ?? undefined,
        why: h.why ?? undefined, stopImpact: h.stop_impact ?? undefined,
        priority: h.priority as import("@/types/lifeos").Habit["priority"],
        impact: h.impact as import("@/types/lifeos").Habit["impact"], activeDays: h.active_days as number[] | undefined,
        frequencyType: h.frequency_type ?? undefined,
        frequencyValue: h.frequency_value ?? undefined,
        lifeScoreWeight: h.life_score_weight != null ? Number(h.life_score_weight) : undefined,
        bestStreak: h.best_streak ?? undefined,
      },
      habitLogsMap,
      goalsMap as Map<string, import("@/types/lifeos").Goal>
    )
  );
  const goalCompletions = goals
    .filter((g) => g.status !== "done")
    .map((g) => {
      const linkedHabits = activeHabitRows
        .filter((h) => h.goal_id === g.id || h.project_id === g.id)
        .map((h) => ({
          id: h.id,
          name: h.name,
          cat: h.cat ?? "prod",
          freq: h.frequency ?? "daily",
          goalLink: h.goal_id ?? undefined,
          activeDays: h.active_days as number[] | undefined,
        }));
      return calcGoalCompletionScore({
        goal: {
          id: g.id, title: g.title, area: "body", priority: "high",
          progress: g.progress, status: g.status as import("@/types/lifeos").GoalStatus,
          level: g.level as import("@/types/lifeos").GoalLevel,
          targetDate: g.target_date ?? g.due_date ?? undefined,
          createdAt: g.created_at,
          tasks: g.tasks as import("@/types/lifeos").GoalTask[] | undefined,
        },
        linkedHabits,
        logs: habitLogsMap,
      });
    });
  const bodyAnalytics = buildBodyAnalytics({
    weightLogs: wLogs.map((w) => ({ id: w.id ?? "", date: w.date, weight: w.weight })),
    measurements: (yearData.measureLogs ?? []).map((m) => ({ ...m })),
    startWeight: startWeight ?? wLogs[0]?.weight ?? null,
    targetWeight,
    heightCm: profile?.height,
    currentWeightOverride: profile?.current_weight,
    weeklyGainTarget: (profile as { weekly_gain_target?: number })?.weekly_gain_target ?? 0.5,
  });
  const bodyCoachInsights = buildBodyCoachInsights({
    weightLogs: wLogs.map((w) => ({ id: w.id ?? "", date: w.date, weight: w.weight })),
    measurements: (yearData.measureLogs ?? []).map((m) => ({ ...m })),
    current: bodyAnalytics.hasWeight ? bodyAnalytics.currentWeight : null,
    target: targetWeight,
    weeklyRate: (profile as { weekly_gain_target?: number })?.weekly_gain_target ?? 0.5,
    bodyGoal: (profile as { body_goal?: string })?.body_goal,
  });
  const habitCoachInsights = buildHabitCoachInsights({
    habits: enrichedHabits,
    goalCompletions,
    body: bodyAnalytics,
    savingsRate,
  });

  const insights = [...bodyCoachInsights, ...habitCoachInsights, ...wealthInsights, ...baseInsights]
    .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
    .slice(0, 10);

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
    missedHabits,
    tasksDueToday,
    tasksDueSoon,
    weekSummary: {
      habitPct,
      workoutsDays: uniqueDays,
      workoutsTarget: 5,
      goalsAvgProgress: Math.round(avgGoalProgress),
      tasksCompletedEstimate: Math.max(0, 10 - tasksDueToday.length),
    },
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
      careerScore: computeUnifiedCareerScore(yearData),
      factors: { habitPct, nutritionScore, workoutScore, avgGoalProgress },
    },
    counts: {
      tasksDueToday: tasksDueToday.length,
      habitsPendingToday: habitsPending.length,
      habitsDoneToday: habitsDone,
      habitsMissed: missedHabits.length,
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
