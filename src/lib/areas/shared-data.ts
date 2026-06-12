import type { SupabaseClient } from "@supabase/supabase-js";
import { calcGoalCompletionScore } from "@/lib/goals/completion";
import { calcAdherence, calcBestStreak } from "@/lib/habits/intelligence";
import { buildBodyAnalytics } from "@/lib/body/analytics";
import { matchesDomain } from "@/lib/areas/match";
import { calcAreaHealthScore } from "@/lib/areas/scores";
import { buildAreaCoachInsights } from "@/lib/areas/coach";
import { buildWealthSnapshot } from "@/lib/wealth/snapshot";
import { getWeekDates, today } from "@/lib/utils";
import type { AreaHubPayload } from "@/types/areas";
import type { Goal } from "@/types/lifeos";

type DomainRow = { id: string; slug: string; name_ar: string; icon: string; color: string };

const GOAL_COLS =
  "id, title, area, category, priority, progress, status, level, parent_id, target_date, due_date, domain_id, habit_contribution_pct, task_contribution_pct, progress_contribution_pct";
const HABIT_COLS =
  "id, name, cat, frequency, active_days, goal_id, project_id, domain_id, category, area, active";
const TASK_COLS = "id, title, status, priority, due_date, goal_id, domain_id, category, area";
const BOOK_COLS = "id, title, status, pages_total, pages, pages_read, cur_page, author, domain_id, category, field";
const COURSE_COLS = "id, title, status, total_hours, hours_completed, progress, domain_id, category, metadata";
const CERT_COLS = "id, name, status, progress_pct, domain_id, category";

export interface AreasSharedData {
  todayStr: string;
  weekStart: string;
  goalsRaw: Record<string, unknown>[];
  habitsRaw: Record<string, unknown>[];
  logsMap: Record<string, Record<string, boolean>>;
  tasksRaw: Record<string, unknown>[];
  booksRaw: Record<string, unknown>[];
  coursesRaw: Record<string, unknown>[];
  certsRaw: Record<string, unknown>[];
  profile: { current_weight?: number; target_weight?: number; start_weight?: number; height?: number } | null;
  weightLogs: { weight: number; log_date: string }[];
  readingLogs: { book_id: string; log_date: string; pages: number; duration_min: number }[];
  studySessions: { duration_min: number; session_date: string }[];
  transactions: { amount: number; type: string; tx_date: string }[];
  allGoals: Goal[];
  learningHours: number;
  bodyProgressGlobal?: number;
}

/** Single batched fetch — replaces N×12 queries in overview */
export async function fetchAreasSharedData(
  db: SupabaseClient,
  userId: string
): Promise<AreasSharedData> {
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
    db.from("goals").select(GOAL_COLS).eq("user_id", userId).in("status", ["active", "paused"]),
    db.from("habits").select(HABIT_COLS).eq("user_id", userId).eq("active", true),
    db.from("habit_logs").select("habit_id, log_date, done").eq("user_id", userId),
    db.from("life_tasks").select(TASK_COLS).eq("user_id", userId).in("status", ["inbox", "active", "done"]),
    db.from("books").select(BOOK_COLS).eq("user_id", userId),
    db.from("courses").select(COURSE_COLS).eq("user_id", userId),
    db.from("certifications").select(CERT_COLS).eq("user_id", userId),
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
  const learningMins =
    (readingRes.data ?? []).reduce((s, r) => s + (r.duration_min ?? 0), 0) +
    (studyRes.data ?? []).reduce((s, r) => s + (r.duration_min ?? 0), 0);
  const learningHours = Math.round((learningMins / 60) * 10) / 10;

  let bodyProgressGlobal: number | undefined;
  const wLogs = (weightRes.data ?? []).map((w) => ({ id: "", date: w.log_date, weight: w.weight }));
  const analytics = buildBodyAnalytics({
    weightLogs: wLogs,
    measurements: [],
    targetWeight: profileRes.data?.target_weight ?? 75,
    currentWeightOverride: profileRes.data?.current_weight,
    startWeight: profileRes.data?.start_weight,
  });
  if (analytics.hasWeight) bodyProgressGlobal = analytics.progressPct;

  return {
    todayStr,
    weekStart,
    goalsRaw: goalsRes.data ?? [],
    habitsRaw: habitsRes.data ?? [],
    logsMap,
    tasksRaw: tasksRes.data ?? [],
    booksRaw: booksRes.data ?? [],
    coursesRaw: coursesRes.data ?? [],
    certsRaw: certsRes.data ?? [],
    profile: profileRes.data,
    weightLogs: weightRes.data ?? [],
    readingLogs: readingRes.data ?? [],
    studySessions: studyRes.data ?? [],
    transactions: txRes.data ?? [],
    allGoals,
    learningHours,
    bodyProgressGlobal,
  };
}

export function buildAreaHubFromShared(
  shared: AreasSharedData,
  domainId: string,
  domain: DomainRow,
  wealthSnapshot?: Awaited<ReturnType<typeof buildWealthSnapshot>>
): AreaHubPayload {
  const { todayStr, weekStart, logsMap, allGoals, learningHours, bodyProgressGlobal } = shared;

  const domainGoals = allGoals.filter((g) => matchesDomain(g, domainId));
  const domainProjects = domainGoals.filter((g) => g.level === "project");
  const topGoals = domainGoals.filter((g) => g.level !== "project");

  const domainHabits = shared.habitsRaw
    .filter((h) => matchesDomain(h, domainId) || domainGoals.some((g) => g.id === h.goal_id || g.id === h.project_id))
    .map((h) => mapHabit(h, logsMap, todayStr));

  const domainTasks = shared.tasksRaw
    .filter((t) => matchesDomain(t, domainId) || (t.goal_id && domainGoals.some((g) => g.id === t.goal_id)))
    .map(mapTask);

  const domainBooks = shared.booksRaw
    .filter((b) =>
      matchesDomain(
        { domain_id: b.domain_id as string, category: b.category as string, area: b.field as string },
        domainId
      )
    )
    .map(mapBook);

  const domainCourses = shared.coursesRaw
    .filter((c) =>
      matchesDomain(
        {
          domain_id: c.domain_id as string,
          category: c.category as string,
          area: (c.metadata as { hub?: string } | null)?.hub,
        },
        domainId
      )
    )
    .map(mapCourse);

  const domainCerts = shared.certsRaw
    .filter((c) =>
      matchesDomain({ domain_id: c.domain_id as string, category: c.category as string }, domainId)
    )
    .map(mapCert);

  const goalItems = topGoals.map((g) => {
    const linkedHabits = shared.habitsRaw
      .filter((h) => h.goal_id === g.id || h.project_id === g.id)
      .map((h) => ({
        id: String(h.id),
        name: String(h.name),
        cat: String(h.cat ?? ""),
        freq: String(h.frequency ?? "daily"),
        goalLink: h.goal_id as string,
        projectId: h.project_id as string,
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

  const bodyProgress = domainId === "domain_body" ? bodyProgressGlobal : undefined;

  let financeScore: number | undefined;
  if (domainId === "domain_finance" && wealthSnapshot) {
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
    weightLogs: shared.weightLogs,
    todayStr,
    weekStart,
  });

  const projectItems = domainProjects.map((p) => ({
    id: p.id,
    title: p.title,
    progress: p.progress ?? 0,
    goalId: p.parentId,
  }));

  const graph = buildKnowledgeGraph(
    goalItems,
    projectItems,
    domainTasks,
    domainHabits,
    booksGrouped,
    coursesGrouped,
    certsGrouped
  );

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
    profile: shared.profile,
    bodyProgress,
    financeScore,
    careerScore,
    learningHours,
    books: booksGrouped,
    courses: coursesGrouped,
    txs: shared.transactions,
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

// --- helpers duplicated from load-hub (kept local to avoid circular imports) ---

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
    events.push({
      id: "weight-week",
      date: input.weekStart,
      icon: "⚖️",
      text: `${delta >= 0 ? "+" : ""}${delta} كجم هذا الأسبوع`,
      period: "week",
    });
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

function buildKnowledgeGraph(
  goals: AreaHubPayload["goals"],
  projects: AreaHubPayload["projects"],
  tasks: AreaHubPayload["tasks"],
  habits: AreaHubPayload["habits"],
  books: { current: { id: string; title: string; progress: number }[] },
  courses: { current: { id: string; title: string; progress: number }[] },
  certs: { current: { id: string; name: string; progressPct: number }[] }
) {
  const nodes: AreaHubPayload["graph"]["nodes"] = [];
  const edges: AreaHubPayload["graph"]["edges"] = [];
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

function buildDomainMetrics(
  domainId: string,
  ctx: {
    profile: AreasSharedData["profile"];
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
    if (ctx.courses.current[0])
      m.push({ label: "دورة", value: `${ctx.courses.current[0].title} ${ctx.courses.current[0].progress}%` });
  }
  return m;
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
  const progress = c.progress != null ? Number(c.progress) : Math.round((done / total) * 100);
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
