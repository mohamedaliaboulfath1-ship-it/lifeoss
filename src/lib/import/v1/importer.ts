import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapBook,
  mapBudget,
  mapDebt,
  mapExercise,
  mapFood,
  mapGoal,
  mapHabit,
  mapHabitLog,
  mapJournal,
  mapMealLog,
  mapMeasurement,
  mapMonthlyReview,
  mapProgressPhoto,
  mapReadingLog,
  mapSettingsProfile,
  mapTask,
  mapTransaction,
  mapWeeklyReview,
  mapWeightLog,
  mapWorkoutLog,
  inferImportYear,
} from "@/lib/import/v1/mappers";
import { v1Id } from "@/lib/import/v1/ids";
import type {
  ImportReport,
  StoreImportReport,
  V1Backup,
  V1StoreName,
} from "@/lib/import/v1/types";
import { V1_STORES } from "@/lib/import/v1/types";

type Db = SupabaseClient;

function emptyReport(store: V1StoreName | string, table: string): StoreImportReport {
  return { store, targetTable: table, inserted: 0, updated: 0, skipped: 0, errors: [] };
}

function countTotals(stores: StoreImportReport[]) {
  return stores.reduce(
    (acc, s) => ({
      inserted: acc.inserted + s.inserted,
      updated: acc.updated + s.updated,
      skipped: acc.skipped + s.skipped,
      errors: acc.errors + s.errors.length,
    }),
    { inserted: 0, updated: 0, skipped: 0, errors: 0 }
  );
}

async function existingIds(
  db: Db,
  table: string,
  userId: string,
  ids: string[]
): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const { data } = await db.from(table).select("id").eq("user_id", userId).in("id", ids);
  return new Set((data ?? []).map((r) => (r as { id: string }).id));
}

async function upsertRows<T extends { id: string; user_id: string }>(
  db: Db,
  table: string,
  rows: T[],
  report: StoreImportReport,
  existing: Set<string>
) {
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    for (const row of batch) {
      if (existing.has(row.id)) report.updated++;
      else report.inserted++;
    }
    const { error } = await db.from(table).upsert(batch, { onConflict: "id" });
    if (error) {
      for (const row of batch) {
        report.errors.push({
          store: report.store,
          legacyId: row.id,
          message: error.message,
        });
        if (existing.has(row.id)) report.updated--;
        else report.inserted--;
        report.skipped++;
      }
    }
  }
}

async function upsertHabitLogs(
  db: Db,
  rows: Array<{
    habit_id: string;
    user_id: string;
    log_date: string;
    done: boolean;
    metadata?: Record<string, unknown>;
  }>,
  report: StoreImportReport
) {
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await db.from("habit_logs").upsert(batch, {
      onConflict: "habit_id,log_date",
    });
    if (error) {
      report.errors.push({ store: report.store, message: error.message });
      report.skipped += batch.length;
    } else {
      report.inserted += batch.length;
    }
  }
}

function stripInternal<T extends Record<string, unknown>>(row: T): Omit<T, "_base64" | "_cover_base64"> {
  const { _base64, _cover_base64, ...rest } = row;
  void _base64;
  void _cover_base64;
  return rest;
}

async function uploadBase64Image(
  db: Db,
  userId: string,
  bucket: string,
  path: string,
  dataUrl?: string
): Promise<string | null> {
  if (!dataUrl?.startsWith("data:")) return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");

  const { error } = await db.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) return null;
  return path;
}

export async function importLifeOSV1(
  db: Db,
  userId: string,
  backup: V1Backup
): Promise<ImportReport> {
  const startedAt = new Date().toISOString();
  const warnings: string[] = [];
  const skippedStores: Array<{ store: string; reason: string }> = [];
  const stores: StoreImportReport[] = [];

  const importYear = inferImportYear(backup);
  const sourceRecords = V1_STORES.reduce((sum, store) => {
    const arr = backup[store];
    return sum + (Array.isArray(arr) ? arr.length : 0);
  }, 0);

  // ── settings → profiles ──
  const settingsReport = emptyReport("settings", "profiles");
  if (Array.isArray(backup.settings) && backup.settings.length) {
    const profile = mapSettingsProfile(userId, backup.settings, importYear);
    const { error } = await db.from("profiles").upsert(profile);
    if (error) {
      settingsReport.errors.push({ store: "settings", message: error.message });
      settingsReport.skipped = 1;
    } else {
      settingsReport.inserted = 1;
    }
  } else {
    settingsReport.skipped = 1;
    warnings.push("لا توجد إعدادات في النسخة الاحتياطية");
  }
  stores.push(settingsReport);

  // ── goals ──
  const goalsReport = emptyReport("goals", "goals");
  const goalRows = (backup.goals ?? [])
    .map((g) => mapGoal(userId, g, importYear))
    .filter(Boolean) as ReturnType<typeof mapGoal>[];
  goalsReport.skipped += (backup.goals?.length ?? 0) - goalRows.length;
  const goalIds = goalRows.map((g) => g!.id);
  const existingGoals = await existingIds(db, "goals", userId, goalIds);
  await upsertRows(db, "goals", goalRows as { id: string; user_id: string }[], goalsReport, existingGoals);
  stores.push(goalsReport);

  // ── habits ──
  const habitsReport = emptyReport("habits", "habits");
  const habitRows = (backup.habits ?? [])
    .map((h) => mapHabit(userId, h, importYear))
    .filter(Boolean) as ReturnType<typeof mapHabit>[];
  habitsReport.skipped += (backup.habits?.length ?? 0) - habitRows.length;
  const habitIds = habitRows.map((h) => h!.id);
  const existingHabits = await existingIds(db, "habits", userId, habitIds);
  await upsertRows(db, "habits", habitRows as { id: string; user_id: string }[], habitsReport, existingHabits);
  stores.push(habitsReport);

  // ── habit_logs ──
  const habitLogsReport = emptyReport("habit_logs", "habit_logs");
  const habitLogRows = (backup.habit_logs ?? [])
    .map((l) => mapHabitLog(userId, l))
    .filter(Boolean) as NonNullable<ReturnType<typeof mapHabitLog>>[];
  habitLogsReport.skipped += (backup.habit_logs?.length ?? 0) - habitLogRows.length;
  await upsertHabitLogs(db, habitLogRows, habitLogsReport);
  stores.push(habitLogsReport);

  // ── tasks ──
  const tasksReport = emptyReport("tasks", "life_tasks");
  const taskRows = (backup.tasks ?? [])
    .map((t) => mapTask(userId, t))
    .filter(Boolean) as ReturnType<typeof mapTask>[];
  tasksReport.skipped += (backup.tasks?.length ?? 0) - taskRows.length;
  const taskIds = taskRows.map((t) => t!.id);
  const existingTasks = await existingIds(db, "life_tasks", userId, taskIds);
  await upsertRows(db, "life_tasks", taskRows as { id: string; user_id: string }[], tasksReport, existingTasks);
  stores.push(tasksReport);

  // ── weight_logs ──
  const weightReport = emptyReport("weight_logs", "weight_logs");
  const weightRows = (backup.weight_logs ?? [])
    .map((w) => mapWeightLog(userId, w))
    .filter(Boolean) as ReturnType<typeof mapWeightLog>[];
  weightReport.skipped += (backup.weight_logs?.length ?? 0) - weightRows.length;
  const weightIds = weightRows.map((w) => w!.id);
  const existingWeight = await existingIds(db, "weight_logs", userId, weightIds);
  await upsertRows(db, "weight_logs", weightRows as { id: string; user_id: string }[], weightReport, existingWeight);
  stores.push(weightReport);

  // ── measurements ──
  const measureReport = emptyReport("measurements", "body_measurements");
  const measureRows = (backup.measurements ?? [])
    .map((m) => mapMeasurement(userId, m))
    .filter(Boolean) as ReturnType<typeof mapMeasurement>[];
  measureReport.skipped += (backup.measurements?.length ?? 0) - measureRows.length;
  const measureIds = measureRows.map((m) => m!.id);
  const existingMeasure = await existingIds(db, "body_measurements", userId, measureIds);
  await upsertRows(db, "body_measurements", measureRows as { id: string; user_id: string }[], measureReport, existingMeasure);
  stores.push(measureReport);

  // ── progress_photos ──
  const photosReport = emptyReport("progress_photos", "progress_photos");
  const photoMapped = (backup.progress_photos ?? [])
    .map((p) => mapProgressPhoto(userId, p))
    .filter(Boolean) as Array<ReturnType<typeof mapProgressPhoto> & { _base64?: string }>;
  photosReport.skipped += (backup.progress_photos?.length ?? 0) - photoMapped.length;

  const photoRows = [];
  for (const raw of photoMapped) {
    const row = { ...raw };
    if (raw._base64) {
      const path = `${userId}/${row.id}.jpg`;
      const uploaded = await uploadBase64Image(db, userId, "progress-photos", path, raw._base64);
      if (uploaded) row.storage_path = uploaded;
      else warnings.push(`تعذر رفع صورة التقدم ${row.legacy_id} — تم حفظ السجل بدون ملف`);
    }
    photoRows.push(stripInternal(row));
  }
  const photoIds = photoRows.map((p) => p.id);
  const existingPhotos = await existingIds(db, "progress_photos", userId, photoIds);
  await upsertRows(db, "progress_photos", photoRows as { id: string; user_id: string }[], photosReport, existingPhotos);
  stores.push(photosReport);

  // ── exercises ──
  const exercisesReport = emptyReport("exercises", "exercises");
  const exerciseRows = (backup.exercises ?? [])
    .map((e) => mapExercise(userId, e))
    .filter(Boolean) as ReturnType<typeof mapExercise>[];
  exercisesReport.skipped += (backup.exercises?.length ?? 0) - exerciseRows.length;
  const exerciseIds = exerciseRows.map((e) => e!.id);
  const existingExercises = await existingIds(db, "exercises", userId, exerciseIds);
  await upsertRows(db, "exercises", exerciseRows as { id: string; user_id: string }[], exercisesReport, existingExercises);
  stores.push(exercisesReport);

  // ── workout_logs ──
  const workoutReport = emptyReport("workout_logs", "workout_set_logs");
  const workoutRows = (backup.workout_logs ?? [])
    .map((w) => mapWorkoutLog(userId, w))
    .filter(Boolean) as ReturnType<typeof mapWorkoutLog>[];
  workoutReport.skipped += (backup.workout_logs?.length ?? 0) - workoutRows.length;
  const workoutIds = workoutRows.map((w) => w!.id);
  const existingWorkouts = await existingIds(db, "workout_set_logs", userId, workoutIds);
  await upsertRows(db, "workout_set_logs", workoutRows as { id: string; user_id: string }[], workoutReport, existingWorkouts);
  stores.push(workoutReport);

  // ── foods ──
  const foodsReport = emptyReport("foods", "foods");
  const foodRows = (backup.foods ?? [])
    .map((f) => mapFood(userId, f))
    .filter(Boolean) as ReturnType<typeof mapFood>[];
  foodsReport.skipped += (backup.foods?.length ?? 0) - foodRows.length;
  const foodIds = foodRows.map((f) => f!.id);
  const existingFoods = await existingIds(db, "foods", userId, foodIds);
  await upsertRows(db, "foods", foodRows as { id: string; user_id: string }[], foodsReport, existingFoods);
  stores.push(foodsReport);

  // ── meals (legacy store — merged into meal_logs in HTML app) ──
  const mealsReport = emptyReport("meals", "—");
  if (Array.isArray(backup.meals) && backup.meals.length > 0) {
    mealsReport.skipped = backup.meals.length;
    skippedStores.push({
      store: "meals",
      reason: "Store legacy غير مستخدم في LifeOS_1 — البيانات الفعلية في meal_logs",
    });
  }
  stores.push(mealsReport);

  // ── meal_logs ──
  const mealLogsReport = emptyReport("meal_logs", "meal_logs");
  const mealLogRows = (backup.meal_logs ?? [])
    .map((m) => mapMealLog(userId, m))
    .filter(Boolean) as ReturnType<typeof mapMealLog>[];
  mealLogsReport.skipped += (backup.meal_logs?.length ?? 0) - mealLogRows.length;
  const mealLogIds = mealLogRows.map((m) => m!.id);
  const existingMealLogs = await existingIds(db, "meal_logs", userId, mealLogIds);
  await upsertRows(db, "meal_logs", mealLogRows as { id: string; user_id: string }[], mealLogsReport, existingMealLogs);
  stores.push(mealLogsReport);

  // ── books ──
  const booksReport = emptyReport("books", "books");
  const bookMapped = (backup.books ?? [])
    .map((b) => mapBook(userId, b))
    .filter(Boolean) as Array<ReturnType<typeof mapBook> & { _cover_base64?: string }>;
  booksReport.skipped += (backup.books?.length ?? 0) - bookMapped.length;

  const bookRows = [];
  for (const raw of bookMapped) {
    const row = { ...raw };
    if (raw._cover_base64) {
      const path = `${userId}/${row.id}.jpg`;
      const uploaded = await uploadBase64Image(db, userId, "book-covers", path, raw._cover_base64);
      if (uploaded) row.cover_path = uploaded;
    }
    bookRows.push(stripInternal(row));
  }
  const bookIds = bookRows.map((b) => b.id);
  const existingBooks = await existingIds(db, "books", userId, bookIds);
  await upsertRows(db, "books", bookRows as { id: string; user_id: string }[], booksReport, existingBooks);
  stores.push(booksReport);

  // ── reading_logs ──
  const readingReport = emptyReport("reading_logs", "reading_logs");
  const readingRows = (backup.reading_logs ?? [])
    .map((r) => mapReadingLog(userId, r))
    .filter(Boolean) as ReturnType<typeof mapReadingLog>[];
  readingReport.skipped += (backup.reading_logs?.length ?? 0) - readingRows.length;
  const readingIds = readingRows.map((r) => r!.id);
  const existingReading = await existingIds(db, "reading_logs", userId, readingIds);
  await upsertRows(db, "reading_logs", readingRows as { id: string; user_id: string }[], readingReport, existingReading);
  stores.push(readingReport);

  // ── transactions ──
  const txReport = emptyReport("transactions", "transactions");
  const txRows = (backup.transactions ?? [])
    .map((t) => mapTransaction(userId, t))
    .filter(Boolean) as ReturnType<typeof mapTransaction>[];
  txReport.skipped += (backup.transactions?.length ?? 0) - txRows.length;
  const txIds = txRows.map((t) => t!.id);
  const existingTx = await existingIds(db, "transactions", userId, txIds);
  await upsertRows(db, "transactions", txRows as { id: string; user_id: string }[], txReport, existingTx);
  stores.push(txReport);

  // ── debts ──
  const debtsReport = emptyReport("debts", "debts");
  const debtRows = (backup.debts ?? [])
    .map((d) => mapDebt(userId, d))
    .filter(Boolean) as ReturnType<typeof mapDebt>[];
  debtsReport.skipped += (backup.debts?.length ?? 0) - debtRows.length;
  const debtIds = debtRows.map((d) => d!.id);
  const existingDebts = await existingIds(db, "debts", userId, debtIds);
  await upsertRows(db, "debts", debtRows as { id: string; user_id: string }[], debtsReport, existingDebts);
  stores.push(debtsReport);

  // ── budgets ──
  const budgetsReport = emptyReport("budgets", "budgets");
  const budgetRows = (backup.budgets ?? [])
    .map((b) => mapBudget(userId, b))
    .filter(Boolean) as ReturnType<typeof mapBudget>[];
  budgetsReport.skipped += (backup.budgets?.length ?? 0) - budgetRows.length;
  if (budgetRows.length) {
    const budgetIds = budgetRows.map((b) => b!.id);
    const existingBudgets = await existingIds(db, "budgets", userId, budgetIds);
    await upsertRows(db, "budgets", budgetRows as { id: string; user_id: string }[], budgetsReport, existingBudgets);
  }
  stores.push(budgetsReport);

  // ── daily_journals ──
  const journalReport = emptyReport("daily_journals", "daily_journals");
  const journalRows = (backup.daily_journals ?? [])
    .map((j) => mapJournal(userId, j))
    .filter(Boolean) as ReturnType<typeof mapJournal>[];
  journalReport.skipped += (backup.daily_journals?.length ?? 0) - journalRows.length;
  const journalIds = journalRows.map((j) => j!.id);
  const existingJournals = await existingIds(db, "daily_journals", userId, journalIds);
  await upsertRows(db, "daily_journals", journalRows as { id: string; user_id: string }[], journalReport, existingJournals);
  stores.push(journalReport);

  // ── weekly_reviews ──
  const weeklyReport = emptyReport("weekly_reviews", "weekly_reviews");
  const weeklyRows = (backup.weekly_reviews ?? [])
    .map((w) => mapWeeklyReview(userId, w))
    .filter(Boolean) as ReturnType<typeof mapWeeklyReview>[];
  weeklyReport.skipped += (backup.weekly_reviews?.length ?? 0) - weeklyRows.length;
  const weeklyIds = weeklyRows.map((w) => w!.id);
  const existingWeekly = await existingIds(db, "weekly_reviews", userId, weeklyIds);
  await upsertRows(db, "weekly_reviews", weeklyRows as { id: string; user_id: string }[], weeklyReport, existingWeekly);
  stores.push(weeklyReport);

  // ── monthly_reviews ──
  const monthlyReport = emptyReport("monthly_reviews", "monthly_reviews");
  const monthlyRows = (backup.monthly_reviews ?? [])
    .map((m) => mapMonthlyReview(userId, m))
    .filter(Boolean) as ReturnType<typeof mapMonthlyReview>[];
  monthlyReport.skipped += (backup.monthly_reviews?.length ?? 0) - monthlyRows.length;
  const monthlyIds = monthlyRows.map((m) => m!.id);
  const existingMonthly = await existingIds(db, "monthly_reviews", userId, monthlyIds);
  await upsertRows(db, "monthly_reviews", monthlyRows as { id: string; user_id: string }[], monthlyReport, existingMonthly);
  stores.push(monthlyReport);

  // ── archive → yearly_snapshots ──
  const archiveReport = emptyReport("archive", "yearly_snapshots");
  const archiveEntries = backup.archive ?? [];
  for (const entry of archiveEntries) {
    const year = String(entry.year ?? importYear);
    const snapId = v1Id("archive", entry.id ?? year);
    const { data: existing } = await db
      .from("yearly_snapshots")
      .select("id")
      .eq("user_id", userId)
      .eq("year", year)
      .maybeSingle();

    const row = {
      user_id: userId,
      year,
      label: entry.label ?? `أرشيف ${year}`,
      payload: entry.data ?? {},
    };

    if (existing) {
      const { error } = await db.from("yearly_snapshots").update(row).eq("id", existing.id);
      if (error) {
        archiveReport.errors.push({ store: "archive", legacyId: entry.id, message: error.message });
        archiveReport.skipped++;
      } else archiveReport.updated++;
    } else {
      const { error } = await db.from("yearly_snapshots").insert({ ...row, id: snapId });
      if (error) {
        archiveReport.errors.push({ store: "archive", legacyId: entry.id, message: error.message });
        archiveReport.skipped++;
      } else archiveReport.inserted++;
    }
  }
  if (!archiveEntries.length) archiveReport.skipped = 0;
  stores.push(archiveReport);

  const totals = countTotals(stores);

  try {
    await db.from("activity_log").insert({
      user_id: userId,
      entity_type: "goal",
      entity_id: `import_${Date.now()}`,
      action: "create",
      summary: `استيراد LifeOS v1: ${totals.inserted} جديد، ${totals.updated} محدّث`,
      changes: { totals, importYear, version: backup.version },
      metadata: { source: "lifeos_v1_import" },
    });
  } catch {
    warnings.push("تعذر تسجيل activity_log — قد تحتاج migration 005");
  }

  const finishedAt = new Date().toISOString();
  const transferred = totals.inserted + totals.updated;
  const dataTransferRate =
    sourceRecords > 0 ? Math.round((transferred / sourceRecords) * 100) : 100;

  return {
    success: totals.errors === 0,
    startedAt,
    finishedAt,
    version: backup.version,
    exportedAt: backup.exported_at,
    importYear,
    stores,
    totals,
    skippedStores,
    warnings,
    dataTransferRate,
  };
}
