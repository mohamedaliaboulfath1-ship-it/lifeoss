import type { SupabaseClient } from "@supabase/supabase-js";

export const SEED_GOAL_ID = "seed_goal_weight";
export const DEFAULT_SEED_EMAIL = "mohamedaliaboulfath1@gmail.com";

type SeedModule = typeof import("../../../scripts/mohamed-arabic-data.mjs");

async function loadSeedData(): Promise<SeedModule> {
  return import("../../../scripts/mohamed-arabic-data.mjs") as Promise<SeedModule>;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function isMohamedArabicSeeded(db: SupabaseClient, userId: string) {
  const { data } = await db
    .from("goals")
    .select("id")
    .eq("user_id", userId)
    .eq("id", SEED_GOAL_ID)
    .maybeSingle();
  return Boolean(data);
}

async function deleteSeedData(db: SupabaseClient, userId: string, IDS: SeedModule["IDS"]) {
  const habitIds = Object.values(IDS).filter((id) => id.startsWith("seed_habit"));
  const bookIds = [IDS.bookBabylon, IDS.bookAtomic, IDS.bookStrength, IDS.bookFinModel];

  for (const { table, col, ids } of [
    { table: "habit_logs", col: "habit_id", ids: habitIds },
    { table: "goal_habit_links", col: "habit_id", ids: habitIds },
    { table: "reading_logs", col: "book_id", ids: bookIds },
  ]) {
    if (!ids.length) continue;
    await db.from(table).delete().eq("user_id", userId).in(col, ids);
  }

  const allSeedIds = Object.values(IDS);
  for (const table of [
    "habits", "life_tasks", "books", "skills", "certifications", "courses",
    "portfolio_projects", "career_milestones", "savings_goals", "net_worth_snapshots",
    "weight_logs", "goals",
  ]) {
    await db.from(table).delete().eq("user_id", userId).in("id", allSeedIds);
  }

  await db.from("life_tasks").delete().eq("user_id", userId).like("id", "seed_%");
  await db.from("expense_categories").delete().eq("user_id", userId).like("id", "seed_%");
}

async function upsertRows(db: SupabaseClient, table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
}

export async function runMohamedArabicSeed(
  db: SupabaseClient,
  userId: string,
  options?: { force?: boolean }
) {
  const { buildSeedPayload, EXPENSE_CATEGORIES, IDS, SEED_TAG, YEAR } = await loadSeedData();

  if (await isMohamedArabicSeeded(db, userId) && !options?.force) {
    return { ok: true as const, alreadySeeded: true };
  }

  if (options?.force) {
    await deleteSeedData(db, userId, IDS);
  }

  const data = buildSeedPayload(userId);
  const allGoals = [...data.visions, ...data.goals, ...data.projects];

  const { error: pErr } = await db.from("profiles").upsert({
    id: userId,
    display_name: "محمد",
    height: 182,
    start_weight: 62,
    current_weight: 62,
    target_weight: 75,
    body_goal: "gain",
    weekly_gain_target: 0.5,
    daily_calories: 3200,
    protein_target: 150,
    carbs_target: 380,
    fats_target: 95,
    water_target_ml: 3000,
    current_year: YEAR,
    onboarded: true,
    career_seeded: true,
    metadata: {
      seed: SEED_TAG,
      bodyPlan: {
        weeklyGainTarget: 0.5,
        bodyGoal: "gain",
        workoutProgram: "PPLUL — 5 أيام أسبوعياً",
        dietPlan: "زيادة الكتلة العضلية",
        dietNotes: "نشاط متوسط · هدف زيادة عضلية",
        activityLevel: "moderate",
        gymDaysPerWeek: 5,
      },
    },
  });
  if (pErr) throw new Error(`profiles: ${pErr.message}`);

  await db.from("life_years").upsert({ user_id: userId, year: YEAR, payload: {} });

  await upsertRows(db, "goals", allGoals);
  await upsertRows(db, "habits", data.habits);

  const links = data.habits
    .filter((h) => h.goal_id)
    .map((h) => ({
      id: `seed_link_${h.id}`,
      user_id: userId,
      goal_id: h.goal_id,
      habit_id: h.id,
      weight: 1,
    }));
  if (links.length) {
    await db.from("goal_habit_links").upsert(links, { onConflict: "id" });
  }

  await upsertRows(db, "life_tasks", data.tasks);
  await upsertRows(db, "books", data.books);
  await upsertRows(db, "weight_logs", [{
    id: IDS.weightLog1,
    user_id: userId,
    domain_id: "domain_body",
    log_date: today(),
    weight: 62,
    note: "الوزن الابتدائي",
    metadata: { seed: SEED_TAG },
  }]);

  await db.from("career_profiles").upsert({
    user_id: userId,
    current_role: "محاسب",
    target_role: "محلل مالي",
    transformation_narrative: "من محاسب إلى محلل مالي ثم محلل مالي أول ثم مدير مالي",
    target_date: "2028-12-31",
    domain_id: "domain_career",
  });

  await upsertRows(db, "career_milestones", data.milestones);
  await upsertRows(db, "skills", data.skills);
  await upsertRows(db, "certifications", data.certifications);
  await upsertRows(db, "courses", [{
    id: IDS.courseExcel,
    user_id: userId,
    title: "Excel المتقدم — برنامج إتقان",
    platform: "ذاتي",
    total_hours: 40,
    hours_completed: 8,
    status: "active",
    linked_goal_id: IDS.goalFinModel,
    metadata: { seed: SEED_TAG, hub: "career", progress: 20 },
  }]);
  await upsertRows(db, "portfolio_projects", [{
    id: IDS.portfolioModel,
    user_id: userId,
    title: "نموذج مالي متكامل — مشروع تخرج مهني",
    description: "بناء نموذج DCF وLBO كمحفظة مهنية",
    skills_used: ["Excel", "النمذجة المالية", "التحليل المالي"],
    status: "active",
    career_impact: 75,
    linked_goal_id: IDS.goalFinModel,
    metadata: { seed: SEED_TAG },
  }]);

  const { count } = await db
    .from("expense_categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (!count) {
    await upsertRows(db, "expense_categories", EXPENSE_CATEGORIES.map((c) => ({
      id: `seed_cat_${c.slug}`,
      user_id: userId,
      ...c,
      is_system: true,
      monthly_budget: null,
    })));
  }

  await upsertRows(db, "savings_goals", [
    {
      id: IDS.savingsEmergency,
      user_id: userId,
      domain_id: "domain_finance",
      name: "صندوق الطوارئ",
      goal_type: "emergency",
      target_amount: 30000,
      current_amount: 1500,
      monthly_contribution: 2000,
      priority: 1,
      notes: "هدف: تغطية 6 أشهر — عدّل المبلغ بعد حساب المصروفات",
      metadata: { seed: SEED_TAG, linkedGoalId: IDS.goalEmergency },
    },
    {
      id: IDS.savingsInvest,
      user_id: userId,
      domain_id: "domain_finance",
      name: "هدف الاستثمار",
      goal_type: "investment",
      target_amount: 100000,
      current_amount: 0,
      monthly_contribution: 0,
      priority: 2,
      notes: "جاهز للتعبئة — المحافظ والاستثمارات",
      metadata: { seed: SEED_TAG, section: "investments" },
    },
  ]);

  await upsertRows(db, "net_worth_snapshots", [{
    id: IDS.netWorthBaseline,
    user_id: userId,
    snapshot_date: today(),
    cash: 0,
    savings: 1500,
    investments: 0,
    debts: 0,
    net_worth: 1500,
    metadata: { seed: SEED_TAG, label: "خط الأساس — صافي الثروة" },
  }]);

  const { error: tErr } = await db.from("user_time_settings").upsert({
    user_id: userId,
    sleep_hours: 8,
    commute_minutes: 60,
    work_days: [0, 1, 2, 3, 4],
    work_start: "08:30",
    work_end: "16:30",
    sat_work_enabled: true,
    sat_work_start: "11:00",
    sat_work_end: "16:00",
    fri_off: true,
    home_arrival: "17:00",
    timezone: "Africa/Cairo",
    updated_at: new Date().toISOString(),
  });
  if (tErr) throw new Error(`user_time_settings: ${tErr.message}`);

  return {
    ok: true as const,
    alreadySeeded: false,
    summary: {
      visions: 3,
      goals: 6,
      projects: 5,
      habits: data.habits.length,
      tasks: data.tasks.length,
      books: data.books.length,
    },
  };
}

export async function maybeSeedMohamedArabic(
  db: SupabaseClient,
  userId: string,
  email?: string | null
) {
  const allowed =
    process.env.MOHAMED_SEED_EMAIL ?? DEFAULT_SEED_EMAIL;
  if (email && email.toLowerCase() !== allowed.toLowerCase()) {
    return { seeded: false, reason: "email_mismatch" as const };
  }
  if (await isMohamedArabicSeeded(db, userId)) {
    return { seeded: false, reason: "already_seeded" as const };
  }
  const result = await runMohamedArabicSeed(db, userId);
  return { seeded: !result.alreadySeeded, result };
}
