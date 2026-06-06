import { createClient } from "@/lib/supabase/server";
import { ensureCareerSeed } from "@/lib/career/ensure-seed";
import { buildDashboardSnapshot } from "@/lib/dashboard/snapshot";
import { loadIdentity, loadRelationalYearData } from "@/lib/relational-data";
import type {
  HabitLogRow,
  HabitRow,
  LifeYearRow,
  ProfileRow,
  WeightLogRow,
} from "@/types/database";
import type { Goal, GoalTask, Habit, WeightLog, YearPayload } from "@/types/lifeos";
import type { DashboardSnapshot } from "@/types/lifeos-pro";

export function mapProfile(row: ProfileRow) {
  return {
    id: row.id,
    displayName: row.display_name,
    city: row.city,
    age: row.age,
    height: row.height,
    startWeight: row.start_weight,
    targetWeight: row.target_weight,
    salary: row.salary,
    targetSalary: row.target_salary,
    startDate: row.start_date,
    currentYear: row.current_year,
    onboarded: row.onboarded,
  };
}

function mapGoal(row: Record<string, unknown>): Goal {
  const progress =
    typeof row.progress === "number"
      ? row.progress
      : parseInt(String(row.current_val ?? "0"), 10) || (row.done ? 100 : 0);
  const status =
    (row.status as Goal["status"]) ?? (row.done ? "done" : "active");

  return {
    id: String(row.id),
    title: String(row.title),
    area: (row.category as Goal["area"]) ?? (row.area as Goal["area"]),
    priority: row.priority as Goal["priority"],
    start: (row.start_date as string) ?? undefined,
    due: (row.due_date as string) ?? undefined,
    targetDate: (row.target_date as string) ?? (row.due_date as string) ?? undefined,
    current: (row.current_val as string) ?? String(progress),
    startVal: (row.start_val as string) ?? (row.current_val as string) ?? undefined,
    target: (row.target_val as string) ?? undefined,
    unit: (row.unit as string) ?? undefined,
    done: Boolean(row.done) || status === "done",
    status,
    progress,
    category: row.category as string | undefined,
    description: row.description as string | undefined,
    why: row.why as string | undefined,
    successCriteria: row.success_criteria as string | undefined,
    level: row.level as Goal["level"],
    parentId: row.parent_id as string | undefined,
    domainId: row.domain_id as string | undefined,
    createdAt: row.created_at as string | undefined,
    tasks: (row.tasks as GoalTask[]) ?? [],
    habits: (row.habits as string) ?? undefined,
  };
}

function mapHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    cat: row.cat,
    freq: row.freq,
    time: row.time ?? undefined,
    dur: row.dur ?? undefined,
    goalLink: row.goal_link ?? (row as HabitRow & { goal_id?: string }).goal_id ?? undefined,
    note: row.note ?? undefined,
  };
}

function mapWeight(row: WeightLogRow): WeightLog {
  return {
    id: row.id,
    date: row.log_date,
    weight: row.weight,
    sleep: row.sleep ?? undefined,
    cals: row.cals ?? undefined,
    note: row.note ?? undefined,
  };
}

function buildHabitLogs(rows: HabitLogRow[]): Record<string, Record<string, boolean>> {
  const logs: Record<string, Record<string, boolean>> = {};
  for (const row of rows) {
    if (!logs[row.habit_id]) logs[row.habit_id] = {};
    logs[row.habit_id][row.log_date] = row.done;
  }
  return logs;
}

async function getCurrentYear(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("current_year")
    .eq("id", userId)
    .single();
  return data?.current_year ?? String(new Date().getFullYear());
}

/** Ensure a life_years row exists (year marker only — payload is always empty). */
async function ensureLifeYearRow(userId: string, year: string): Promise<LifeYearRow> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("life_years")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .maybeSingle();

  if (existing) return existing as LifeYearRow;

  const { data: created, error } = await supabase
    .from("life_years")
    .insert({
      user_id: userId,
      year,
      payload: {},
    })
    .select()
    .single();

  if (error) throw error;
  return created as LifeYearRow;
}

/** Assemble YearPayload exclusively from Supabase relational tables. */
export async function assembleYearPayload(
  userId: string,
  year: string
): Promise<YearPayload> {
  const supabase = await createClient();

  await ensureCareerSeed(supabase, userId);

  const [goalsRes, habitsRes, logsRes, weightRes, relational, identity] =
    await Promise.all([
      supabase.from("goals").select("*").eq("user_id", userId).eq("year", year),
      supabase.from("habits").select("*").eq("user_id", userId).eq("year", year),
      supabase
        .from("habit_logs")
        .select("habit_id, log_date, done")
        .eq("user_id", userId),
      supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", userId)
        .order("log_date", { ascending: true }),
      loadRelationalYearData(supabase, userId),
      loadIdentity(supabase, userId),
    ]);

  const habitIds = new Set((habitsRes.data ?? []).map((h) => h.id));
  const filteredLogs = (logsRes.data ?? []).filter((l) =>
    habitIds.has(l.habit_id)
  ) as HabitLogRow[];

  return {
    goals: (goalsRes.data ?? []).map((g) => mapGoal(g as Record<string, unknown>)),
    habits: (habitsRes.data ?? []).map((h) => mapHabit(h as HabitRow)),
    habitLogs: buildHabitLogs(filteredLogs),
    weightLogs: (weightRes.data ?? []).map((w) => mapWeight(w as WeightLogRow)),
    identity,
    tasks: relational.tasks,
    books: relational.books,
    transactions: relational.transactions,
    debts: relational.debts,
    foods: relational.foods,
    mealLogs: relational.mealLogs,
    exercises: relational.exercises,
    measureLogs: relational.measureLogs,
    workoutLogs: relational.workoutLogs,
    dailyJournals: relational.dailyJournals,
    reviews: relational.reviews,
    careerRoadmap: relational.careerRoadmap,
    careerSkillMatrix: relational.careerSkillMatrix,
    careerCertifications: relational.careerCertifications,
    careerCourses: relational.careerCourses,
    jobApplications: relational.jobApplications,
    interviews: relational.interviews,
    mentors: relational.mentors,
    networkContacts: relational.networkContacts,
    learningPaths: relational.learningPaths,
    learningCourses: relational.learningCourses,
    learningCertifications: relational.learningCertifications,
    studySessions: relational.studySessions,
    knowledgeAreas: relational.knowledgeAreas,
    pomSessions: relational.readingSessions,
    skills: [],
    portfolio: [],
    milestones: [],
    timeslots: {},
    energy: [],
  };
}

export async function getOrCreateLifeYear(userId: string, year: string) {
  const record = await ensureLifeYearRow(userId, year);
  const data = await assembleYearPayload(userId, year);
  return { record, data };
}

/** @deprecated Payload writes removed — use entity APIs. */
export async function saveLifeYearPayload(
  _userId: string,
  _year: string,
  _payload: YearPayload
) {
  throw new Error("PAYLOAD_WRITE_DEPRECATED: use entity APIs (/api/tasks, /api/body, etc.)");
}

/** @deprecated */
export async function saveLifeYear(
  _userId: string,
  _year: string,
  _data: YearPayload
) {
  throw new Error("PAYLOAD_WRITE_DEPRECATED: use entity APIs");
}

async function ensureProfile(userId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return existing as ProfileRow;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "مستخدم";

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      display_name: displayName,
      current_year: String(new Date().getFullYear()),
    })
    .select("*")
    .single();

  if (error) {
    console.error("ensureProfile:", error);
    throw new Error("PROFILE_NOT_FOUND");
  }

  return created as ProfileRow;
}

export async function getUserContext(userId: string) {
  const supabase = await createClient();
  const profileRow = await ensureProfile(userId);

  const profile = mapProfile(profileRow);
  const currentYear = profile.currentYear;

  const { data: yearRows } = await supabase
    .from("life_years")
    .select("year")
    .eq("user_id", userId)
    .order("year", { ascending: false });

  const years = (yearRows ?? []).map((y) => y.year);
  if (!years.includes(currentYear)) years.unshift(currentYear);

  const { data: yearData } = await getOrCreateLifeYear(userId, currentYear);

  let dashboard: DashboardSnapshot | null = null;
  try {
    dashboard = await buildDashboardSnapshot(
      supabase,
      userId,
      profile.displayName,
      yearData
    );
  } catch (e) {
    console.warn("dashboard snapshot:", e);
  }

  return { profile, years, currentYear, yearData, dashboard };
}

export async function getYearForUser(userId: string, yearParam?: string | null) {
  const year = yearParam ?? (await getCurrentYear(userId));
  const { data } = await getOrCreateLifeYear(userId, year);
  return { year, data };
}
