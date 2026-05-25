export interface ProfileRow {
  id: string;
  display_name: string;
  city: string | null;
  age: number | null;
  height: number | null;
  start_weight: number | null;
  target_weight: number | null;
  salary: number | null;
  target_salary: number | null;
  start_date: string | null;
  current_year: string;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface LifeYearRow {
  id: string;
  user_id: string;
  year: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GoalRow {
  id: string;
  user_id: string;
  year: string;
  title: string;
  area: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  current_val: string | null;
  target_val: string | null;
  unit: string | null;
  done: boolean;
  tasks: unknown;
  habits: string | null;
}

export interface HabitRow {
  id: string;
  user_id: string;
  year: string;
  name: string;
  cat: string;
  freq: string;
  time: string | null;
  dur: number | null;
  goal_link: string | null;
  note: string | null;
}

export interface HabitLogRow {
  habit_id: string;
  log_date: string;
  done: boolean;
}

export interface WeightLogRow {
  id: string;
  log_date: string;
  weight: number;
  sleep: number | null;
  cals: number | null;
  note: string | null;
}

export interface WorkoutRow {
  id: string;
  workout_date: string;
  workout_type: string | null;
  duration_min: number | null;
  energy: number | null;
  notes: string | null;
  sets: unknown;
}

export interface MealRow {
  id: string;
  meal_date: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  note: string | null;
}
