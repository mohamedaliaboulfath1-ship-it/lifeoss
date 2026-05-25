import { DEFAULT_RULES } from "@/lib/constants";
import { createDefaultYearPayload } from "@/lib/calculations";
import { createClient } from "@/lib/supabase/server";
import type {
  GoalRow,
  HabitLogRow,
  HabitRow,
  LifeYearRow,
  ProfileRow,
  WeightLogRow,
  WorkoutRow,
} from "@/types/database";
import type { Goal, GoalTask, Habit, WeightLog, YearPayload } from "@/types/lifeos";

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

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    area: row.area as Goal["area"],
    priority: row.priority as Goal["priority"],
    start: row.start_date ?? undefined,
    due: row.due_date ?? undefined,
    current: row.current_val ?? undefined,
    target: row.target_val ?? undefined,
    unit: row.unit ?? undefined,
    done: row.done,
    tasks: (row.tasks as GoalTask[]) ?? [],
    habits: row.habits ?? undefined,
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
    goalLink: row.goal_link ?? undefined,
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

export function parseYearPayload(raw: unknown): YearPayload {
  const base = createDefaultYearPayload();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Partial<YearPayload>;
  return {
    ...base,
    ...data,
    goals: [],
    habits: [],
    habitLogs: {},
    weightLogs: [],
    workoutLogs: [],
    identity: {
      traits: data.identity?.traits ?? [],
      rules: data.identity?.rules?.length
        ? data.identity.rules
        : [...DEFAULT_RULES],
    },
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

export async function getOrCreateLifeYear(userId: string, year: string) {
  const supabase = await createClient();

  let { data: lifeYear } = await supabase
    .from("life_years")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .maybeSingle();

  if (!lifeYear) {
    const payload = createDefaultYearPayload();
    payload.identity.rules = [...DEFAULT_RULES];
    const { data: created, error } = await supabase
      .from("life_years")
      .insert({
        user_id: userId,
        year,
        payload: payload as unknown as Record<string, unknown>,
      })
      .select()
      .single();
    if (error) throw error;
    lifeYear = created as LifeYearRow;
  }

  const [goalsRes, habitsRes, logsRes, weightRes, workoutsRes] =
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
      supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId)
        .order("workout_date", { ascending: true }),
    ]);

  const habitIds = new Set((habitsRes.data ?? []).map((h) => h.id));
  const filteredLogs = (logsRes.data ?? []).filter((l) =>
    habitIds.has(l.habit_id)
  ) as HabitLogRow[];

  const payload = parseYearPayload(lifeYear.payload);
  const data: YearPayload = {
    ...payload,
    goals: (goalsRes.data ?? []).map((g) => mapGoal(g as GoalRow)),
    habits: (habitsRes.data ?? []).map((h) => mapHabit(h as HabitRow)),
    habitLogs: buildHabitLogs(filteredLogs),
    weightLogs: (weightRes.data ?? []).map((w) => mapWeight(w as WeightLogRow)),
    workoutLogs: (workoutsRes.data ?? []).map((w) => {
      const row = w as WorkoutRow;
      return {
        id: row.id,
        date: row.workout_date,
        type: row.workout_type,
        duration: row.duration_min,
        energy: row.energy,
        notes: row.notes,
        sets: row.sets,
      };
    }),
  };

  return { record: lifeYear as LifeYearRow, data };
}

/** Persist JSON-only fields (books, finance, identity, …) */
export async function saveLifeYearPayload(
  userId: string,
  year: string,
  payload: YearPayload
) {
  const supabase = await createClient();
  const stored = {
    measureLogs: payload.measureLogs,
    books: payload.books,
    transactions: payload.transactions,
    skills: payload.skills,
    portfolio: payload.portfolio,
    reviews: payload.reviews,
    pomSessions: payload.pomSessions,
    milestones: payload.milestones,
    timeslots: payload.timeslots,
    identity: payload.identity,
    energy: payload.energy,
  };

  const { error } = await supabase.from("life_years").upsert(
    {
      user_id: userId,
      year,
      payload: stored as unknown as Record<string, unknown>,
    },
    { onConflict: "user_id,year" }
  );
  if (error) throw error;
}

export async function saveLifeYear(
  userId: string,
  year: string,
  data: YearPayload
) {
  await saveLifeYearPayload(userId, year, data);
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

  return { profile, years, currentYear, yearData };
}

export async function getYearForUser(userId: string, yearParam?: string | null) {
  const year = yearParam ?? (await getCurrentYear(userId));
  const { data } = await getOrCreateLifeYear(userId, year);
  return { year, data };
}
