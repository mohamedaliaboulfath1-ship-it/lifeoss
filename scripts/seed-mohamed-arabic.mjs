#!/usr/bin/env node
/**
 * LifeOS — بذر البيانات الأولية العربية لمحمد
 *
 * يستخدم Supabase service role (يتجاوز RLS).
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-mohamed-arabic.mjs
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-mohamed-arabic.mjs --force
 *   SEED_USER_EMAIL=you@email.com node scripts/seed-mohamed-arabic.mjs
 */
import { createClient } from "@supabase/supabase-js";
import {
  buildSeedPayload,
  EXPENSE_CATEGORIES,
  IDS,
  SEED_TAG,
  YEAR,
} from "./mohamed-arabic-data.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const password = process.env.SEED_USER_PASSWORD;
const email = process.env.SEED_USER_EMAIL ?? "mohamedaliaboulfath1@gmail.com";
const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");

if (!url) {
  console.error("❌ عيّن NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

let db;
let userIdFromAuth = null;

if (serviceKey) {
  db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else if (anonKey && password) {
  db = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else {
  console.error("❌ عيّن SUPABASE_SERVICE_ROLE_KEY أو SEED_USER_PASSWORD + ANON_KEY");
  console.error("   أو سجّل الدخول بعد النشر — البذر التلقائي يعمل عند فتح التطبيق");
  process.exit(1);
}

const today = () => new Date().toISOString().slice(0, 10);

async function findUserId() {
  if (userIdFromAuth) return userIdFromAuth;
  if (serviceKey) {
    const { data, error } = await db.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error(`لم يُعثر على مستخدم بالبريد: ${email}`);
    return user.id;
  }
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`تسجيل الدخول: ${error?.message ?? "فشل"}`);
  userIdFromAuth = data.user.id;
  return userIdFromAuth;
}

async function alreadySeeded(userId) {
  const { data } = await db
    .from("goals")
    .select("id")
    .eq("user_id", userId)
    .eq("id", IDS.goalWeight)
    .maybeSingle();
  return Boolean(data);
}

async function deleteSeedData(userId) {
  const habitIds = Object.values(IDS).filter((id) => id.startsWith("seed_habit"));
  const tables = [
    { table: "habit_logs", col: "habit_id", ids: habitIds },
    { table: "goal_habit_links", col: "habit_id", ids: habitIds },
    { table: "reading_logs", col: "book_id", ids: [IDS.bookBabylon, IDS.bookAtomic, IDS.bookStrength, IDS.bookFinModel] },
  ];

  for (const { table, col, ids } of tables) {
    if (!ids.length) continue;
    await db.from(table).delete().eq("user_id", userId).in(col, ids);
  }

  const byIdTables = [
    "habits", "life_tasks", "books", "skills", "certifications", "courses",
    "portfolio_projects", "career_milestones", "savings_goals", "net_worth_snapshots",
    "weight_logs", "goals",
  ];

  const allSeedIds = Object.values(IDS);
  for (const table of byIdTables) {
    await db.from(table).delete().eq("user_id", userId).in("id", allSeedIds);
  }

  // tasks with seed_ prefix
  await db.from("life_tasks").delete().eq("user_id", userId).like("id", "seed_%");
  await db.from("expense_categories").delete().eq("user_id", userId).like("id", "seed_%");
}

async function upsert(table, rows, label) {
  if (!rows.length) return;
  if (dryRun) {
    console.log(`  [dry-run] ${label}: ${rows.length} صف`);
    return;
  }
  const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ✓ ${label}: ${rows.length}`);
}

async function main() {
  console.log("\n🌱 LifeOS — بذر البيانات الأولية العربية\n");

  const userId = await findUserId();
  console.log(`  المستخدم: ${email}`);
  console.log(`  UUID:     ${userId}\n`);

  if (await alreadySeeded(userId) && !force) {
    console.log("⚠️  البيانات موجودة مسبقاً (seed_goal_weight).");
    console.log("   أعد التشغيل مع --force لاستبدالها.\n");
    process.exit(0);
  }

  if (force && !dryRun) {
    console.log("🗑️  حذف البيانات السابقة (seed_*)...");
    await deleteSeedData(userId);
  }

  const data = buildSeedPayload(userId);
  const allGoals = [...data.visions, ...data.goals, ...data.projects];

  // ── Profile + life year ──
  const profile = {
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
  };

  if (!dryRun) {
    const { error: pErr } = await db.from("profiles").upsert(profile);
    if (pErr) throw new Error(`profiles: ${pErr.message}`);
    console.log("  ✓ الملف الشخصي + خطة الجسم");

    await db.from("life_years").upsert({
      user_id: userId,
      year: YEAR,
      payload: {},
    });
    console.log("  ✓ سنة الحياة", YEAR);
  } else {
    console.log("  [dry-run] profiles + life_years");
  }

  // ── PARA hierarchy ──
  console.log("\n📐 PARA — رؤى وأهداف ومشاريع");
  await upsert("goals", allGoals, "أهداف PARA");

  // ── Habits + links ──
  console.log("\n🔄 العادات");
  await upsert("habits", data.habits, "عادات");

  if (!dryRun) {
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
      const { error } = await db.from("goal_habit_links").upsert(links, { onConflict: "id" });
      if (error) console.warn("  ⚠ goal_habit_links:", error.message);
      else console.log(`  ✓ روابط العادات: ${links.length}`);
    }
  }

  // ── Tasks ──
  console.log("\n✅ المهام");
  await upsert("life_tasks", data.tasks, "مهام");

  // ── Books ──
  console.log("\n📚 الكتب");
  await upsert("books", data.books, "كتب");

  // ── Body ──
  console.log("\n⚖️ الجسم");
  await upsert(
    "weight_logs",
    [{
      id: IDS.weightLog1,
      user_id: userId,
      domain_id: "domain_body",
      log_date: today(),
      weight: 62,
      note: "الوزن الابتدائي",
      metadata: { seed: SEED_TAG },
    }],
    "سجل الوزن"
  );

  // ── Career ──
  console.log("\n📈 المسار المهني");
  if (!dryRun) {
    const { error } = await db.from("career_profiles").upsert({
      user_id: userId,
      current_role: "محاسب",
      target_role: "محلل مالي",
      transformation_narrative: "من محاسب إلى محلل مالي ثم محلل مالي أول ثم مدير مالي",
      target_date: "2028-12-31",
      domain_id: "domain_career",
    });
    if (error) throw new Error(`career_profiles: ${error.message}`);
    console.log("  ✓ الملف المهني");
  }
  await upsert("career_milestones", data.milestones, "مراحل المسار");
  await upsert("skills", data.skills, "مهارات");
  await upsert("certifications", data.certifications, "شهادات");

  await upsert(
    "courses",
    [{
      id: IDS.courseExcel,
      user_id: userId,
      title: "Excel المتقدم — برنامج إتقان",
      platform: "ذاتي",
      total_hours: 40,
      hours_completed: 8,
      status: "active",
      linked_goal_id: IDS.goalFinModel,
      metadata: { seed: SEED_TAG, hub: "career", progress: 20 },
    }],
    "دورة Excel"
  );

  await upsert(
    "portfolio_projects",
    [{
      id: IDS.portfolioModel,
      user_id: userId,
      title: "نموذج مالي متكامل — مشروع تخرج مهني",
      description: "بناء نموذج DCF وLBO كمحفظة مهنية",
      skills_used: ["Excel", "النمذجة المالية", "التحليل المالي"],
      status: "active",
      career_impact: 75,
      linked_goal_id: IDS.goalFinModel,
      metadata: { seed: SEED_TAG },
    }],
    "مشروع محفظة"
  );

  // ── Wealth (أقسام فارغة جاهزة) ──
  console.log("\n💰 الثروة — أقسام جاهزة");
  const catRows = EXPENSE_CATEGORIES.map((c, i) => ({
    id: `seed_cat_${c.slug}`,
    user_id: userId,
    ...c,
    is_system: true,
    monthly_budget: null,
  }));
  if (!dryRun) {
    const { count } = await db
      .from("expense_categories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (!count) {
      await upsert("expense_categories", catRows, "فئات المصروفات");
    } else {
      console.log("  ↷ فئات المصروفات موجودة — تخطي");
    }
  }

  await upsert(
    "savings_goals",
    [
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
        metadata: { seed: SEED_TAG, linkedGoalId: IDS.goalEmergency, empty: false },
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
        metadata: { seed: SEED_TAG, section: "investments", empty: true },
      },
    ],
    "أهداف الادخار"
  );

  await upsert(
    "net_worth_snapshots",
    [{
      id: IDS.netWorthBaseline,
      user_id: userId,
      snapshot_date: today(),
      cash: 0,
      savings: 1500,
      investments: 0,
      debts: 0,
      net_worth: 1500,
      metadata: { seed: SEED_TAG, label: "خط الأساس — صافي الثروة" },
    }],
    "لقطة صافي الثروة"
  );

  // subscriptions, investments, debts → فارغة عمداً (الأقسام جاهزة في الواجهة)

  // ── Time OS ──
  console.log("\n⏰ إعدادات الوقت");
  if (!dryRun) {
    const { error } = await db.from("user_time_settings").upsert({
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
    if (error) throw new Error(`user_time_settings: ${error.message}`);
    console.log("  ✓ جدول العمل (أحد–خميس 8:30–16:30 · سبت 11:00–16:00 · جمعة إجازة)");
  } else {
    console.log("  [dry-run] user_time_settings");
  }

  console.log("\n✅ اكتمل البذر بنجاح!");
  console.log("\nالملخص:");
  console.log(`  • 3 رؤى · 6 أهداف · 5 مشاريع`);
  console.log(`  • ${data.habits.length} عادة · ${data.tasks.length} مهمة · ${data.books.length} كتب`);
  console.log(`  • ${data.skills.length} مهارات · ${data.certifications.length} شهادات · 4 مراحل مهنية`);
  console.log(`  • ثروة: فئات + صندوق طوارئ + خط أساس صافي الثروة`);
  console.log(`  • الوزن: 62 كجم → الهدف 75 كجم`);
  console.log("\nجميع العناصر قابلة للتعديل والحذف من الواجهة.\n");
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});
