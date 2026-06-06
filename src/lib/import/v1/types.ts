/** LifeOS_1.html exportAllData() backup format */

export const V1_STORES = [
  "settings",
  "goals",
  "habits",
  "habit_logs",
  "tasks",
  "weight_logs",
  "measurements",
  "progress_photos",
  "exercises",
  "workout_logs",
  "foods",
  "meals",
  "meal_logs",
  "books",
  "reading_logs",
  "transactions",
  "budgets",
  "debts",
  "daily_journals",
  "weekly_reviews",
  "monthly_reviews",
  "archive",
] as const;

export type V1StoreName = (typeof V1_STORES)[number];

export interface V1Backup {
  version?: string;
  exported_at?: string;
  settings?: V1Settings[];
  goals?: V1Goal[];
  habits?: V1Habit[];
  habit_logs?: V1HabitLog[];
  tasks?: V1Task[];
  weight_logs?: V1WeightLog[];
  measurements?: V1Measurement[];
  progress_photos?: V1ProgressPhoto[];
  exercises?: V1Exercise[];
  workout_logs?: V1WorkoutLog[];
  foods?: V1Food[];
  meals?: V1Meal[];
  meal_logs?: V1MealLog[];
  books?: V1Book[];
  reading_logs?: V1ReadingLog[];
  transactions?: V1Transaction[];
  budgets?: V1Budget[];
  debts?: V1Debt[];
  daily_journals?: V1Journal[];
  weekly_reviews?: V1WeeklyReview[];
  monthly_reviews?: V1MonthlyReview[];
  archive?: V1ArchiveEntry[];
  [key: string]: unknown;
}

export interface V1Record {
  id?: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface V1Settings extends V1Record {
  name?: string;
  age?: number;
  height?: number;
  startWeight?: number;
  targetWeight?: number;
  salary?: number;
  targetSalary?: number;
  startDate?: string;
  dailyCalories?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatsTarget?: number;
  city?: string;
}

export interface V1Goal extends V1Record {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  target_date?: string;
  progress?: number;
  why?: string;
  success_criteria?: string;
  status?: string;
}

export interface V1Habit extends V1Record {
  name?: string;
  category?: string;
  frequency?: string;
  time_of_day?: string;
  duration?: number;
  target_count?: number;
  goal_id?: number | null;
  notes?: string;
  active?: boolean;
  streak?: number;
  best_streak?: number;
}

export interface V1HabitLog extends V1Record {
  habit_id?: number;
  date?: string;
  completed?: boolean;
}

export interface V1Task extends V1Record {
  title?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  estimated_time?: number;
  goal_id?: number | null;
  notes?: string;
  completed_date?: string;
}

export interface V1WeightLog extends V1Record {
  date?: string;
  weight?: number;
  sleep?: number;
  cals?: number;
  note?: string;
  notes?: string;
}

export interface V1Measurement extends V1Record {
  date?: string;
  chest?: number;
  arm?: number;
  waist?: number;
  thigh?: number;
  calf?: number;
  body_fat?: number;
  notes?: string;
}

export interface V1ProgressPhoto extends V1Record {
  image?: string;
  date?: string;
  weight?: number;
  notes?: string;
}

export interface V1Exercise extends V1Record {
  name?: string;
  muscle_group?: string;
  equipment?: string;
  notes?: string;
}

export interface V1WorkoutLog extends V1Record {
  date?: string;
  exercise_id?: number;
  weight?: number;
  reps?: number;
  sets?: number;
  rpe?: number;
  rest_time?: number;
  workout_type?: string;
  notes?: string;
}

export interface V1Food extends V1Record {
  name?: string;
  portion?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  category?: string;
}

export interface V1Meal extends V1Record {
  name?: string;
  [key: string]: unknown;
}

export interface V1MealLog extends V1Record {
  date?: string;
  time?: string;
  meal_name?: string;
  food_id?: number;
  food_name?: string;
  multiplier?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  notes?: string;
}

export interface V1Book extends V1Record {
  title?: string;
  author?: string;
  category?: string;
  status?: string;
  priority?: string;
  pages_total?: number;
  pages_read?: number;
  rating?: number;
  start_date?: string;
  finish_date?: string;
  goal_id?: number | null;
  cover?: string;
  notes?: string;
}

export interface V1ReadingLog extends V1Record {
  book_id?: number;
  date?: string;
  pages?: number;
  duration?: number;
  notes?: string;
}

export interface V1Transaction extends V1Record {
  type?: string;
  amount?: number;
  date?: string;
  category?: string;
  description?: string;
}

export interface V1Budget extends V1Record {
  category?: string;
  monthly_limit?: number;
  month?: number;
  year?: number;
  notes?: string;
}

export interface V1Debt extends V1Record {
  name?: string;
  type?: string;
  amount?: number;
  remaining_amount?: number;
  monthly_payment?: number;
  due_date?: string;
  status?: string;
  notes?: string;
}

export interface V1Journal extends V1Record {
  date?: string;
  mood_score?: number;
  gratitudes?: string;
  wins?: string;
  lesson?: string;
  tomorrow_plan?: string;
  notes?: string;
}

export interface V1WeeklyReview extends V1Record {
  date?: string;
  wins?: string;
  failures?: string;
  time_thieves?: string;
  biggest_lesson?: string;
  next_week_focus?: string;
}

export interface V1MonthlyReview extends V1Record {
  date?: string;
  month_name?: string;
  top_wins?: string;
  area_ratings?: string;
  lessons?: string;
  stop_doing?: string;
  start_doing?: string;
  next_focus?: string;
}

export interface V1ArchiveEntry extends V1Record {
  year?: number | string;
  label?: string;
  data?: Record<string, unknown>;
  archived_at?: string;
}

export interface ImportError {
  store: string;
  legacyId?: number | string;
  message: string;
}

export interface StoreImportReport {
  store: V1StoreName | string;
  targetTable: string;
  inserted: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportReport {
  success: boolean;
  startedAt: string;
  finishedAt: string;
  version?: string;
  exportedAt?: string;
  importYear: string;
  stores: StoreImportReport[];
  totals: {
    inserted: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  skippedStores: Array<{ store: string; reason: string }>;
  warnings: string[];
  dataTransferRate: number;
}
