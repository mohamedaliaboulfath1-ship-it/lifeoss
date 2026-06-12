import type { SupabaseClient } from "@supabase/supabase-js";
import { calcGoalCompletionScore } from "@/lib/goals/completion";
import { calcAdherence, calcBestStreak } from "@/lib/habits/intelligence";
import { buildBodyAnalytics } from "@/lib/body/analytics";
import { matchesDomain } from "@/lib/areas/match";
import { calcAreaHealthScore } from "@/lib/areas/scores";
import { buildAreaCoachInsights } from "@/lib/areas/coach";
import { buildWealthSnapshot } from "@/lib/wealth/snapshot";
import { getWeekDates, today } from "@/lib/utils";
import type {
  AreaHubPayload,
  AreaPreview,
  AreasOverviewStats,
  GoalDrillDown,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
} from "@/types/areas";
import type { Goal, Habit } from "@/types/lifeos";

type DomainRow = { id: string; slug: string; name_ar: string; icon: string; color: string };

export async function loadAreaHub(
  db: SupabaseClient,
  userId: string,
  domainId: string,
  domain: DomainRow
): Promise<AreaHubPayload> {
  const todayStr = today();
  const weekStart = getWeekDates(0)[0];

  const [
    goalsRes,
    habitsRes,
    habitLogsRes,
    tasksRes,
    booksRes,
    coursesRes,
    certsRes,
    profileRes,
    weightRes,
    readingRes,
    studyRes,
    txRes,
  ] = await Promise.all([
    db.from("goals").select("*").eq("user_id", userId).in("status", ["active", "paused"]),
    db.from("habits").select("*").eq("user_id", userId).eq("active", true),
    db.from("habit_logs").select("habit_id, log_date, done").eq("user_id", userId),
    db.from("life_tasks").select("*").eq("user_id", userId).in("status", ["inbox", "active", "done"]),
    db.from("books").select("*").eq("user_id", userId),
    db.from("courses").select("*").eq("user_id", userId),
    db.from("certifications").select("*").eq("user_id", userId),
    db.from("profiles").select("current_weight, target_weight, start_weight, height").eq("id", userId).maybeSingle(),
    db.from("weight_logs").select("weight, log_date").eq("user_id", userId).order("log_date", { ascending: true }),
    db.from("reading_logs").select("book_id, log_date, pages, duration_min").eq("user_id", userId).gte("log_date", weekStart),
    db.from("study_sessions").select("duration_min, session_date").eq("user_id", userId).gte("session_date", weekStart),
    db.from("transactions").select("amount, type, tx_date").eq("user_id", userId).gte("tx_date", `${todayStr.slice(0, 7)}-01`),
  ]);

  const logsMap: Record<string, Record<string, boolean>> = {};
  for (const l of habitLogsRes.data ?? []) {
    if (!logsMap[l.habit_id]) logsMap[l.habit_id] = {};
    logsMap[l.habit_id][l.log_date] = l.done;
  }

  const allGoals = (goalsRes.data ?? []).map(mapGoalRow);
  const domainGoals = allGoals.filter((g) => matchesDomain(g, domainId));
  const domainProjects = domainGoals.filter((g) => g.level === "project");
  const topGoals = domainGoals.filter((g) => g.level !== "project");

  const domainHabits = (habitsRes.data ?? [])
    .filter((h) => matchesDomain(h, domainId) || domainGoals.some((g) => g.id === h.goal_id || g.id === h.project_id))
    .map((h) => mapHabit(h, logsMap, todayStr));

  const domainTasks = (tasksRes.data ?? [])
    .filter((t) => matchesDomain(t, domainId) || (t.goal_id && domainGoals.some((g) => g.id === t.goal_id)))
    .map(mapTask);

  const domainBooks = (booksRes.data ?? [])
    .filter((b) => matchesDomain({ domain_id: b.domain_id, category: b.category, area: b.field }, domainId))
    .map(mapBook);

  const domainCourses = (coursesRes.data ?? [])
    .filter((c) => matchesDomain({ domain_id: c.domain_id, category: c.category, area: (c.metadata as { hub?: string } | null)?.hub }, domainId))
    .map(mapCourse);

  const domainCerts = (certsRes.data ?? [])
    .filter((c) => matchesDomain({ domain_id: c.domain_id, category: c.category }, domainId))
    .map(mapCert);

  const goalItems = topGoals.map((g) => {
    const linkedHabits = (habitsRes.data ?? []).filter((h) => h.goal_id === g.id || h.project_id === g.id).map((h) => ({
      id: h.id, name: h.name, cat: h.cat ?? "", freq: h.frequency ?? "daily",
      goalLink: h.goal_id, projectId: h.project_id,
    }));
    const linkedTasks = domainTasks.filter((t) => t.goalId === g.id);
    const completion = calcGoalCompletionScore({
      goal: g,
      linkedHabits,
      logs: logsMap,
      linkedTaskDone: linkedTasks.filter((t) => t.status === "done").length,
      linkedTaskTotal: linkedTasks.length,
    });
    return {
      id: g.id,
      title: g.title,
      progress: g.progress ?? 0,
      status: g.status ?? "active",
      level: g.level,
      targetDate: g.targetDate ?? g.due,
      completion,
    };
  });

  const tasksDueToday = domainTasks.filter((t) => t.dueDate === todayStr && t.status !== "done");
  const tasksOverdue = domainTasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== "done");

  let bodyProgress: number | undefined;
  if (domainId === "domain_body") {
    const wLogs = (weightRes.data ?? []).map((w) => ({ id: "", date: w.log_date, weight: w.weight }));
    const analytics = buildBodyAnalytics({
      weightLogs: wLogs,
      measurements: [],
      targetWeight: profileRes.data?.target_weight ?? 75,
      currentWeightOverride: profileRes.data?.current_weight,
      startWeight: profileRes.data?.start_weight,
    });
    bodyProgress = analytics.hasWeight ? analytics.progressPct : undefined;
  }

  let financeScore: number | undefined;
  let wealthSnapshot: Awaited<ReturnType<typeof buildWealthSnapshot>> | undefined;
  if (domainId === "domain_finance") {
    wealthSnapshot = await buildWealthSnapshot(db, userId);
    financeScore = Math.min(100, Math.round(wealthSnapshot.savingsRate * 0.5 + wealthSnapshot.fiProgress * 0.5));
  }

  let careerScore: number | undefined;
  if (domainId === "domain_career") {
    const goalAvg =
      goalItems.length > 0
        ? Math.round(goalItems.reduce((s, g) => s + g.progress, 0) / goalItems.length)
        : 0;
    const certAvg =
      domainCerts.length > 0
        ? Math.round(domainCerts.reduce((s, c) => s + c.progressPct, 0) / domainCerts.length)
        : 0;
    careerScore = Math.round(goalAvg * 0.55 + certAvg * 0.45);
  }

  const learningMins =
    (readingRes.data ?? []).reduce((s, r) => s + (r.duration_min ?? 0), 0) +
    (studyRes.data ?? []).reduce((s, r) => s + (r.duration_min ?? 0), 0);
  const learningHours = Math.round((learningMins / 60) * 10) / 10;

  const { score: healthScore, reasons: scoreReasons } = calcAreaHealthScore({
    domainId,
    goals: goalItems,
    habits: domainHabits,
    tasksDone: domainTasks.filter((t) => t.status === "done").length,
    tasksTotal: domainTasks.length,
    booksProgress: domainBooks.map((b) => b.progress),
    bodyProgress,
    financeScore,
    careerScore,
    learningHours: domainId === "domain_learning" ? learningHours : undefined,
  });

  const booksGrouped = {
    current: domainBooks.filter((b) => b.status === "reading"),
    upcoming: domainBooks.filter((b) => b.status === "planned"),
    completed: domainBooks.filter((b) => b.status === "done"),
  };

  const coursesGrouped = {
    current: domainCourses.filter((c) => c.status === "active"),
    next: domainCourses.filter((c) => c.status === "planned"),
    completed: domainCourses.filter((c) => c.status === "done"),
  };

  const certsGrouped = {
    current: domainCerts.filter((c) => c.status === "studying" || c.status === "active"),
    upcoming: domainCerts.filter((c) => c.status === "planned"),
    completed: domainCerts.filter((c) => c.status === "passed" || c.status === "done"),
  };

  const timeline = buildTimeline({
    habits: domainHabits,
    tasks: domainTasks,
    books: booksGrouped,
    weightLogs: weightRes.data ?? [],
    todayStr,
    weekStart,
  });

  const projectItems = domainProjects.map((p) => ({
    id: p.id,
    title: p.title,
    progress: p.progress ?? 0,
    goalId: p.parentId,
  }));

  const graph = buildKnowledgeGraph(goalItems, projectItems, domainTasks, domainHabits, booksGrouped, coursesGrouped, certsGrouped);

  const coach = buildAreaCoachInsights({
    areaName: domain.name_ar,
    healthScore,
    goals: goalItems,
    habits: domainHabits,
    tasksDueToday,
    tasksOverdue,
    weeklyDelta: bodyProgress != null ? `تقدمت ${bodyProgress}% نحو هدف الجسم` : undefined,
  });

  const metrics = buildDomainMetrics(domainId, {
    profile: profileRes.data,
    bodyProgress,
    financeScore,
    careerScore,
    learningHours,
    books: booksGrouped,
    courses: coursesGrouped,
    txs: txRes.data ?? [],
    wealth: wealthSnapshot,
  });

  return {
    area: { id: domain.id, slug: domain.slug, nameAr: domain.name_ar, icon: domain.icon, color: domain.color },
    healthScore,
    scoreReasons,
    goals: goalItems,
    projects: projectItems,
    tasks: domainTasks,
    tasksDueToday,
    tasksOverdue,
    habits: domainHabits,
    books: booksGrouped,
    courses: coursesGrouped,
    certifications: certsGrouped,
    timeline,
    coach,
    graph,
    counts: {
      goals: goalItems.length,
      habits: domainHabits.length,
      tasks: domainTasks.filter((t) => t.status !== "done").length,
      books: domainBooks.length,
      projects: domainProjects.length,
    },
    metrics,
  };
}

export async function loadAreasOverview(
  db: SupabaseClient,
  userId: string
): Promise<{ previews: AreaPreview[]; stats: AreasOverviewStats }> {
  const { data: domains } = await db
    .from("life_domains")
    .select("id, slug, name_ar, icon, color")
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .eq("is_active", true)
    .order("sort_order");

  const areas = domains ?? [];
  const hubs = await Promise.all(areas.map((d) => loadAreaHub(db, userId, d.id, d)));
  const weekEnd = getWeekDates(0)[6];

  const previews = areas.map((d, i) => {
    const hub = hubs[i];
    return {
      id: d.id,
      slug: d.slug,
      nameAr: d.name_ar,
      icon: d.icon,
      color: d.color,
      healthScore: hub.healthScore,
      scoreReasons: hub.scoreReasons,
      activeGoals: hub.counts.goals,
      habits: hub.counts.habits,
      tasks: hub.counts.tasks,
      books: hub.counts.books,
      projects: hub.counts.projects,
      highlights: buildPreviewHighlights(d.id, hub),
      needsAttention: hub.coach.filter((c) => c.priority === "high").map((c) => c.message),
      currentFocus: buildCurrentFocus(hub),
      nextAction: buildNextAction(hub),
    };
  });

  const tasksThisWeek = hubs.reduce((sum, hub) => {
    const weekTasks = hub.tasks.filter(
      (t) =>
        t.status !== "done" &&
        t.dueDate &&
        t.dueDate >= getWeekDates(0)[0] &&
        t.dueDate <= weekEnd
    );
    return sum + weekTasks.length;
  }, 0);

  const stats: AreasOverviewStats = {
    lifeScore: previews.length
      ? Math.round(previews.reduce((s, p) => s + p.healthScore, 0) / previews.length)
      : 0,
    activeGoals: previews.reduce((s, p) => s + p.activeGoals, 0),
    activeProjects: previews.reduce((s, p) => s + p.projects, 0),
    habits: previews.reduce((s, p) => s + p.habits, 0),
    tasksThisWeek,
    areasNeedingAttention: previews.filter((p) => p.needsAttention.length > 0).length,
  };

  return { previews, stats };
}

function buildCurrentFocus(hub: AreaHubPayload): string {
  if (hub.goals[0]) return hub.goals[0].title;
  if (hub.projects[0]) return hub.projects[0].title;
  if (hub.metrics[0]) return `${hub.metrics[0].label}: ${hub.metrics[0].value}`;
  if (hub.books.current[0]) return hub.books.current[0].title;
  return "حدد تركيزك القادم";
}

function buildNextAction(hub: AreaHubPayload): string {
  const highCoach = hub.coach.find((c) => c.priority === "high");
  if (highCoach?.action) return highCoach.action;
  if (highCoach?.message) return highCoach.message;
  if (hub.tasksDueToday[0]) return hub.tasksDueToday[0].title;
  if (hub.tasksOverdue[0]) return hub.tasksOverdue[0].title;
  if (hub.coach[0]?.message) return hub.coach[0].message;
  return "راجع المجال وحدّث خطتك";
}

export function loadGoalDrillDown(hub: AreaHubPayload, goalId: string): GoalDrillDown | null {
  const goal = hub.goals.find((g) => g.id === goalId);
  if (!goal) return null;
  return {
    goal,
    projects: hub.projects.filter((p) => p.goalId === goalId),
    tasks: hub.tasks.filter((t) => t.goalId === goalId),
    habits: hub.habits.filter((h) => h.goalLink === goalId),
    metrics: hub.scoreReasons.map((r, i) => ({ label: `مؤشر ${i + 1}`, value: r })),
    forecast: goal.completion?.probabilityText,
  };
}

function buildPreviewHighlights(_domainId: string, hub: AreaHubPayload): { label: string; value: string }[] {
  const h = [...hub.metrics];
  h.push(
    { label: "Life Score", value: `${hub.healthScore}%` },
    { label: "أهداف", value: String(hub.counts.goals) },
    { label: "عادات", value: String(hub.counts.habits) },
    { label: "مهام", value: String(hub.counts.tasks) }
  );
  if (hub.books.current[0]) {
    h.push({ label: "كتاب حالي", value: `${hub.books.current[0].title} ${hub.books.current[0].progress}%` });
  }
  if (hub.courses.current[0]) {
    h.push({ label: "دورة", value: `${hub.courses.current[0].title} ${hub.courses.current[0].progress}%` });
  }
  return h.slice(0, 6);
}

function buildDomainMetrics(
  domainId: string,
  ctx: {
    profile: { current_weight?: number; target_weight?: number } | null;
    bodyProgress?: number;
    financeScore?: number;
    careerScore?: number;
    learningHours: number;
    books: AreaHubPayload["books"];
    courses: AreaHubPayload["courses"];
    txs: { amount: number; type: string }[];
    wealth?: Awaited<ReturnType<typeof buildWealthSnapshot>>;
  }
): { label: string; value: string }[] {
  const m: { label: string; value: string }[] = [];

  if (domainId === "domain_body") {
    if (ctx.profile?.current_weight) m.push({ label: "الوزن الحالي", value: `${ctx.profile.current_weight} كجم` });
    m.push({ label: "الهدف", value: `${ctx.profile?.target_weight ?? 75} كجم` });
    if (ctx.bodyProgress != null) m.push({ label: "التقدم", value: `${ctx.bodyProgress}%` });
  }

  if (domainId === "domain_finance" && ctx.wealth) {
    m.push({ label: "Net Worth", value: `${Math.round(ctx.wealth.netWorth).toLocaleString()}` });
    m.push({ label: "ادخار", value: `${Math.round(ctx.wealth.savings).toLocaleString()}` });
    m.push({ label: "استثمارات", value: `${Math.round(ctx.wealth.investments).toLocaleString()}` });
    m.push({ label: "اشتراكات", value: `${Math.round(ctx.wealth.subscriptionMonthly).toLocaleString()}/شهر` });
    if (ctx.financeScore != null) m.push({ label: "Financial Score", value: `${ctx.financeScore}%` });
  } else if (domainId === "domain_finance") {
    const income = ctx.txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const savings = ctx.txs.filter((t) => t.type === "savings").reduce((s, t) => s + t.amount, 0);
    if (income) m.push({ label: "دخل الشهر", value: `${Math.round(income)}` });
    if (savings) m.push({ label: "ادخار", value: `${Math.round(savings)}` });
    if (ctx.financeScore != null) m.push({ label: "Financial Score", value: `${ctx.financeScore}%` });
  }

  if (domainId === "domain_career" && ctx.careerScore != null) {
    m.push({ label: "Career Score", value: `${ctx.careerScore}%` });
    if (ctx.courses.current[0]) m.push({ label: "دورة حالية", value: ctx.courses.current[0].title });
  }

  if (domainId === "domain_learning") {
    m.push({ label: "ساعات التعلم", value: `${ctx.learningHours}س` });
    if (ctx.books.current[0]) m.push({ label: "كتاب", value: ctx.books.current[0].title });
    if (ctx.courses.current[0]) m.push({ label: "دورة", value: `${ctx.courses.current[0].title} ${ctx.courses.current[0].progress}%` });
  }

  return m;
}

function buildKnowledgeGraph(
  goals: AreaHubPayload["goals"],
  projects: AreaHubPayload["projects"],
  tasks: AreaHubPayload["tasks"],
  habits: AreaHubPayload["habits"],
  books: { current: { id: string; title: string; progress: number }[] },
  courses: { current: { id: string; title: string; progress: number }[] },
  certs: { current: { id: string; name: string; progressPct: number }[] }
): { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] } {
  const nodes: KnowledgeGraphNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];

  for (const g of goals.slice(0, 3)) {
    nodes.push({ id: g.id, type: "goal", label: g.title, progress: g.progress });
    for (const p of projects.filter((x) => x.goalId === g.id)) {
      nodes.push({ id: p.id, type: "project", label: p.title, progress: p.progress });
      edges.push({ from: g.id, to: p.id });
    }
    for (const h of habits.filter((x) => x.goalLink === g.id).slice(0, 2)) {
      nodes.push({ id: h.id, type: "habit", label: h.name });
      edges.push({ from: g.id, to: h.id });
    }
    for (const t of tasks.filter((x) => x.goalId === g.id).slice(0, 2)) {
      nodes.push({ id: t.id, type: "task", label: t.title });
      edges.push({ from: g.id, to: t.id });
    }
  }
  for (const b of books.current.slice(0, 1)) {
    nodes.push({ id: b.id, type: "book", label: b.title, progress: b.progress });
    if (goals[0]) edges.push({ from: goals[0].id, to: b.id });
  }
  for (const c of certs.current.slice(0, 1)) {
    nodes.push({ id: c.id, type: "cert", label: c.name, progress: c.progressPct });
    if (goals[0]) edges.push({ from: goals[0].id, to: c.id });
  }
  for (const co of courses.current.slice(0, 1)) {
    nodes.push({ id: co.id, type: "course", label: co.title, progress: co.progress });
    if (goals[0]) edges.push({ from: goals[0].id, to: co.id });
  }

  return { nodes, edges };
}

function buildTimeline(input: {
  habits: AreaHubPayload["habits"];
  tasks: AreaHubPayload["tasks"];
  books: AreaHubPayload["books"];
  weightLogs: { log_date: string; weight: number }[];
  todayStr: string;
  weekStart: string;
}): AreaHubPayload["timeline"] {
  const events: AreaHubPayload["timeline"] = [];
  const doneHabits = input.habits.filter((h) => h.doneToday);
  for (const h of doneHabits.slice(0, 3)) {
    events.push({ id: `h-${h.id}`, date: input.todayStr, icon: "✅", text: `أكملت: ${h.name}`, period: "today" });
  }
  const doneTasks = input.tasks.filter((t) => t.status === "done");
  for (const t of doneTasks.slice(0, 2)) {
    events.push({ id: `t-${t.id}`, date: input.todayStr, icon: "📋", text: `مهمة: ${t.title}`, period: "today" });
  }
  if (input.books.current[0]) {
    events.push({
      id: "book-read",
      date: input.todayStr,
      icon: "📖",
      text: `قراءة: ${input.books.current[0].title}`,
      period: "today",
    });
  }
  const weekWeights = input.weightLogs.filter((w) => w.log_date >= input.weekStart);
  if (weekWeights.length >= 2) {
    const delta = Math.round((weekWeights[weekWeights.length - 1].weight - weekWeights[0].weight) * 10) / 10;
    events.push({ id: "weight-week", date: input.weekStart, icon: "⚖️", text: `${delta >= 0 ? "+" : ""}${delta} كجم هذا الأسبوع`, period: "week" });
  }
  events.push({
    id: "habits-week",
    date: input.weekStart,
    icon: "🔄",
    text: `${input.habits.filter((h) => h.adherencePct >= 70).length} عادات فوق 70%`,
    period: "week",
  });
  return events;
}

function mapGoalRow(row: Record<string, unknown>): Goal {
  return {
    id: String(row.id),
    title: String(row.title),
    area: (row.area ?? row.category) as Goal["area"],
    category: row.category as string,
    priority: (row.priority as Goal["priority"]) ?? "med",
    progress: (row.progress as number) ?? 0,
    status: (row.status as Goal["status"]) ?? "active",
    level: row.level as Goal["level"],
    parentId: row.parent_id as string,
    targetDate: (row.target_date ?? row.due_date) as string,
    due: row.due_date as string,
    domainId: row.domain_id as string,
    tasks: row.tasks as Goal["tasks"],
    habitContributionPct: row.habit_contribution_pct as number,
    taskContributionPct: row.task_contribution_pct as number,
    progressContributionPct: row.progress_contribution_pct as number,
  };
}

function mapHabit(h: Record<string, unknown>, logs: Record<string, Record<string, boolean>>, todayStr: string) {
  const id = String(h.id);
  const days = (h.active_days as number[]) ?? [0, 1, 2, 3, 4, 5, 6];
  return {
    id,
    name: String(h.name),
    adherencePct: calcAdherence(id, logs, days, 14),
    streak: calcBestStreak(id, logs),
    doneToday: Boolean(logs[id]?.[todayStr]),
    goalLink: h.goal_id as string,
  };
}

function mapTask(t: Record<string, unknown>) {
  return {
    id: String(t.id),
    title: String(t.title),
    status: String(t.status),
    priority: String(t.priority),
    dueDate: t.due_date as string,
    goalId: t.goal_id as string,
  };
}

function mapBook(b: Record<string, unknown>) {
  const pages = (b.pages_total as number) ?? (b.pages as number) ?? 1;
  const cur = (b.pages_read as number) ?? (b.cur_page as number) ?? 0;
  return {
    id: String(b.id),
    title: String(b.title),
    status: String(b.status ?? "planned"),
    progress: pages > 0 ? Math.round((cur / pages) * 100) : 0,
    author: b.author as string,
  };
}

function mapCourse(c: Record<string, unknown>) {
  const total = (c.total_hours as number) ?? 1;
  const done = (c.hours_completed as number) ?? 0;
  const progress =
    c.progress != null
      ? Number(c.progress)
      : Math.round((done / total) * 100);
  return {
    id: String(c.id),
    title: String(c.title),
    progress,
    status: String(c.status ?? "planned"),
  };
}

function mapCert(c: Record<string, unknown>) {
  return {
    id: String(c.id),
    name: String(c.name),
    status: String(c.status),
    progressPct: (c.progress_pct as number) ?? 0,
  };
}
