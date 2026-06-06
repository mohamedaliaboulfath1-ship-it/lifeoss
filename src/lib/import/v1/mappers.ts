import { resolveDomainId } from "@/lib/domains";
import {
  bookRef,
  exerciseRef,
  foodRef,
  goalRef,
  parseLegacyId,
  v1Id,
} from "@/lib/import/v1/ids";
import type {
  V1Book,
  V1Budget,
  V1Debt,
  V1Exercise,
  V1Food,
  V1Goal,
  V1Habit,
  V1HabitLog,
  V1Journal,
  V1MealLog,
  V1Measurement,
  V1MonthlyReview,
  V1ProgressPhoto,
  V1ReadingLog,
  V1Settings,
  V1Task,
  V1Transaction,
  V1WeeklyReview,
  V1WeightLog,
  V1WorkoutLog,
} from "@/lib/import/v1/types";

export function mapPriority(p?: string): "high" | "med" | "low" {
  if (p === "high") return "high";
  if (p === "low") return "low";
  if (p === "medium") return "med";
  return "med";
}

export function mapGoalStatus(
  status?: string,
  progress?: number
): "active" | "done" | "paused" | "cancelled" {
  if (status === "done" || status === "cancelled" || status === "paused") {
    return status;
  }
  if (progress === 100) return "done";
  return "active";
}

export function mapTaskStatus(
  status?: string
): "inbox" | "active" | "done" | "archive" {
  if (status === "done") return "done";
  if (status === "doing" || status === "active") return "active";
  if (status === "archive") return "archive";
  return "inbox";
}

export function mapTaskPriority(p?: string): "p1" | "p2" | "p3" | "p4" {
  if (p === "p1" || p === "p2" || p === "p3" || p === "p4") return p;
  return "p3";
}

export function inferImportYear(backup: {
  exported_at?: string;
  settings?: V1Settings[];
}): string {
  if (backup.exported_at) {
    return String(new Date(backup.exported_at).getFullYear());
  }
  if (backup.settings?.[0]?.startDate) {
    return String(new Date(backup.settings[0].startDate).getFullYear());
  }
  return String(new Date().getFullYear());
}

export function mapSettingsProfile(
  userId: string,
  settings: V1Settings[],
  importYear: string
) {
  const s = settings[0] ?? {};
  return {
    id: userId,
    display_name: s.name ?? "مستخدم",
    age: s.age ?? null,
    height: s.height ?? null,
    start_weight: s.startWeight ?? null,
    target_weight: s.targetWeight ?? null,
    salary: s.salary ?? null,
    target_salary: s.targetSalary ?? null,
    start_date: s.startDate ?? null,
    life_start_date: s.startDate ?? null,
    daily_calories: s.dailyCalories ?? 3000,
    protein_target: s.proteinTarget ?? 130,
    carbs_target: s.carbsTarget ?? 350,
    fats_target: s.fatsTarget ?? 90,
    current_year: importYear,
    onboarded: true,
  };
}

export function mapGoal(
  userId: string,
  g: V1Goal,
  importYear: string
) {
  const legacyId = parseLegacyId(g.id);
  if (legacyId === null) return null;

  const category = g.category ?? "self_dev";
  const domainId = resolveDomainId(category);
  const status = mapGoalStatus(g.status, g.progress);
  const progress = g.progress ?? (status === "done" ? 100 : 0);

  return {
    id: v1Id("goal", legacyId),
    user_id: userId,
    year: importYear,
    title: g.title ?? "هدف بدون عنوان",
    area: category,
    category,
    domain_id: domainId,
    priority: mapPriority(g.priority),
    level: "goal" as const,
    time_horizon_id: "horizon_annual",
    parent_id: null,
    description: g.description ?? null,
    why: g.why ?? null,
    success_criteria: g.success_criteria ?? null,
    status,
    progress,
    target_date: g.target_date ?? null,
    due_date: g.target_date ?? null,
    done: status === "done",
    current_val: String(progress),
    start_val: "0",
    target_val: "100",
    unit: "%",
    tasks: [],
    habits: null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapHabit(userId: string, h: V1Habit, importYear: string) {
  const legacyId = parseLegacyId(h.id);
  if (legacyId === null) return null;

  const category = h.category ?? "discipline";
  return {
    id: v1Id("habit", legacyId),
    user_id: userId,
    year: importYear,
    name: h.name ?? "عادة",
    cat: category,
    category,
    domain_id: resolveDomainId(category),
    freq: h.frequency ?? "daily",
    frequency: h.frequency ?? "daily",
    time: h.time_of_day ?? null,
    time_of_day: h.time_of_day ?? null,
    dur: h.duration ?? null,
    target_count: h.target_count ?? null,
    active: h.active ?? true,
    streak: h.streak ?? 0,
    best_streak: h.best_streak ?? 0,
    goal_id: goalRef(h.goal_id ?? null),
    goal_link: goalRef(h.goal_id ?? null),
    note: h.notes ?? null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapHabitLog(userId: string, log: V1HabitLog) {
  const habitLegacy = parseLegacyId(log.habit_id);
  if (habitLegacy === null || !log.date) return null;

  return {
    habit_id: v1Id("habit", habitLegacy),
    user_id: userId,
    log_date: log.date,
    done: log.completed ?? false,
    metadata: { legacy_id: parseLegacyId(log.id), imported_from: "lifeos_v1" },
  };
}

export function mapTask(userId: string, t: V1Task) {
  const legacyId = parseLegacyId(t.id);
  if (legacyId === null) return null;

  const category = "discipline";
  return {
    id: v1Id("task", legacyId),
    user_id: userId,
    domain_id: resolveDomainId(category),
    title: t.title ?? "مهمة",
    priority: mapTaskPriority(t.priority),
    status: mapTaskStatus(t.status),
    due_date: t.due_date ?? null,
    estimated_time: t.estimated_time ?? null,
    goal_id: goalRef(t.goal_id ?? null),
    completed_date: t.completed_date ?? null,
    notes: t.notes ?? null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapWeightLog(userId: string, w: V1WeightLog) {
  const legacyId = parseLegacyId(w.id);
  if (legacyId === null || !w.date) return null;

  return {
    id: v1Id("weight", legacyId),
    user_id: userId,
    domain_id: "domain_body",
    log_date: w.date,
    weight: w.weight ?? 0,
    sleep: w.sleep ?? null,
    cals: w.cals ?? null,
    note: w.note ?? w.notes ?? null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapMeasurement(userId: string, m: V1Measurement) {
  const legacyId = parseLegacyId(m.id);
  if (legacyId === null || !m.date) return null;

  return {
    id: v1Id("measurement", legacyId),
    user_id: userId,
    domain_id: "domain_body",
    measure_date: m.date,
    chest: m.chest ?? null,
    arm: m.arm ?? null,
    waist: m.waist ?? null,
    thigh: m.thigh ?? null,
    calf: m.calf ?? null,
    body_fat: m.body_fat ?? null,
    notes: m.notes ?? null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapProgressPhoto(userId: string, p: V1ProgressPhoto) {
  const legacyId = parseLegacyId(p.id);
  if (legacyId === null || !p.date) return null;

  return {
    id: v1Id("photo", legacyId),
    user_id: userId,
    domain_id: "domain_body",
    photo_date: p.date,
    weight: p.weight ?? null,
    notes: p.notes ?? null,
    storage_path: null as string | null,
    legacy_id: legacyId,
    metadata: {
      imported_from: "lifeos_v1",
      has_base64: Boolean(p.image?.startsWith("data:")),
    },
    _base64: p.image,
  };
}

export function mapExercise(userId: string, e: V1Exercise) {
  const legacyId = parseLegacyId(e.id);
  if (legacyId === null) return null;

  return {
    id: v1Id("exercise", legacyId),
    user_id: userId,
    domain_id: "domain_body",
    name: e.name ?? "تمرين",
    muscle_group: e.muscle_group ?? null,
    equipment: e.equipment ?? null,
    notes: e.notes ?? null,
    is_custom: true,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapWorkoutLog(userId: string, w: V1WorkoutLog) {
  const legacyId = parseLegacyId(w.id);
  if (legacyId === null || !w.date) return null;

  return {
    id: v1Id("workout", legacyId),
    user_id: userId,
    domain_id: "domain_body",
    log_date: w.date,
    exercise_id: exerciseRef(w.exercise_id ?? null),
    weight: w.weight ?? null,
    reps: w.reps ?? null,
    sets: w.sets ?? null,
    rpe: w.rpe ?? null,
    rest_time: w.rest_time ?? null,
    workout_type: w.workout_type ?? null,
    notes: w.notes ?? null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapFood(userId: string, f: V1Food) {
  const legacyId = parseLegacyId(f.id);
  if (legacyId === null) return null;

  return {
    id: v1Id("food", legacyId),
    user_id: userId,
    domain_id: "domain_body",
    name: f.name ?? "طعام",
    portion: f.portion ?? null,
    calories: f.calories ?? 0,
    protein: f.protein ?? 0,
    carbs: f.carbs ?? 0,
    fats: f.fats ?? 0,
    category: f.category ?? null,
    is_custom: true,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapMealLog(userId: string, m: V1MealLog) {
  const legacyId = parseLegacyId(m.id);
  if (legacyId === null || !m.date) return null;

  return {
    id: v1Id("meal", legacyId),
    user_id: userId,
    domain_id: "domain_body",
    log_date: m.date,
    log_time: m.time ?? null,
    meal_name: m.meal_name ?? null,
    food_id: foodRef(m.food_id ?? null),
    food_name: m.food_name ?? null,
    multiplier: m.multiplier ?? 1,
    calories: m.calories ?? 0,
    protein: m.protein ?? 0,
    carbs: m.carbs ?? 0,
    fats: m.fats ?? 0,
    notes: m.notes ?? null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapBook(userId: string, b: V1Book) {
  const legacyId = parseLegacyId(b.id);
  if (legacyId === null) return null;

  const category = b.category ?? "learning";
  return {
    id: v1Id("book", legacyId),
    user_id: userId,
    domain_id: resolveDomainId(category),
    title: b.title ?? "كتاب",
    author: b.author ?? null,
    category,
    status: b.status ?? "planned",
    priority: mapPriority(b.priority),
    pages_total: b.pages_total ?? null,
    pages_read: b.pages_read ?? 0,
    rating: b.rating ?? null,
    start_date: b.start_date ?? null,
    finish_date: b.finish_date ?? null,
    goal_id: goalRef(b.goal_id ?? null),
    cover_path: null as string | null,
    notes: b.notes ?? null,
    legacy_id: legacyId,
    metadata: {
      imported_from: "lifeos_v1",
      has_cover_base64: Boolean(b.cover?.startsWith("data:")),
    },
    _cover_base64: b.cover,
  };
}

export function mapReadingLog(userId: string, r: V1ReadingLog) {
  const legacyId = parseLegacyId(r.id);
  const bookLegacy = parseLegacyId(r.book_id);
  if (legacyId === null || bookLegacy === null || !r.date) return null;

  return {
    id: v1Id("reading", legacyId),
    user_id: userId,
    domain_id: "domain_learning",
    book_id: bookRef(bookLegacy)!,
    log_date: r.date,
    pages: r.pages ?? 0,
    duration_min: r.duration ?? null,
    notes: r.notes ?? null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapTransaction(userId: string, t: V1Transaction) {
  const legacyId = parseLegacyId(t.id);
  if (legacyId === null || !t.date) return null;

  const type =
    t.type === "income" || t.type === "expense" || t.type === "savings"
      ? t.type
      : "expense";

  return {
    id: v1Id("tx", legacyId),
    user_id: userId,
    domain_id: "domain_finance",
    tx_date: t.date,
    type,
    amount: t.amount ?? 0,
    category: t.category ?? null,
    description: t.description ?? null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapDebt(userId: string, d: V1Debt) {
  const legacyId = parseLegacyId(d.id);
  if (legacyId === null) return null;

  const debtType =
    d.type === "loan" || d.type === "credit_card" ? d.type : "installment";

  return {
    id: v1Id("debt", legacyId),
    user_id: userId,
    domain_id: "domain_finance",
    name: d.name ?? "دين",
    debt_type: debtType,
    amount: d.amount ?? 0,
    remaining_amount: d.remaining_amount ?? d.amount ?? 0,
    monthly_payment: d.monthly_payment ?? null,
    due_date: d.due_date ?? null,
    status: d.status === "paid" ? "paid" : "active",
    notes: d.notes ?? null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapBudget(userId: string, b: V1Budget) {
  const legacyId = parseLegacyId(b.id);
  if (legacyId === null || !b.category) return null;

  const now = new Date();
  return {
    id: v1Id("budget", legacyId),
    user_id: userId,
    domain_id: "domain_finance",
    category: b.category,
    monthly_limit: b.monthly_limit ?? 0,
    month: b.month ?? now.getMonth() + 1,
    year: b.year ?? now.getFullYear(),
    notes: b.notes ?? null,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapJournal(userId: string, j: V1Journal) {
  const legacyId = parseLegacyId(j.id);
  if (legacyId === null || !j.date) return null;

  return {
    id: v1Id("journal", legacyId),
    user_id: userId,
    domain_id: "domain_self_dev",
    journal_date: j.date,
    mood_score: j.mood_score ?? null,
    gratitudes: j.gratitudes ?? null,
    wins: j.wins ?? null,
    lesson: j.lesson ?? null,
    tomorrow_plan: j.tomorrow_plan ?? null,
    notes: j.notes ?? null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapWeeklyReview(userId: string, w: V1WeeklyReview) {
  const legacyId = parseLegacyId(w.id);
  if (legacyId === null || !w.date) return null;

  return {
    id: v1Id("weekly", legacyId),
    user_id: userId,
    review_date: w.date,
    wins: w.wins ?? null,
    failures: w.failures ?? null,
    time_thieves: w.time_thieves ?? null,
    biggest_lesson: w.biggest_lesson ?? null,
    next_week_focus: w.next_week_focus ?? null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}

export function mapMonthlyReview(userId: string, m: V1MonthlyReview) {
  const legacyId = parseLegacyId(m.id);
  if (legacyId === null || !m.date) return null;

  return {
    id: v1Id("monthly", legacyId),
    user_id: userId,
    review_date: m.date,
    month_name: m.month_name ?? null,
    top_wins: m.top_wins ?? null,
    area_ratings: m.area_ratings ?? null,
    lessons: m.lessons ?? null,
    stop_doing: m.stop_doing ?? null,
    start_doing: m.start_doing ?? null,
    next_focus: m.next_focus ?? null,
    legacy_id: legacyId,
    metadata: { imported_from: "lifeos_v1" },
  };
}
