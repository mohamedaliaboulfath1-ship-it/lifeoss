import { calcGoalPct, calcOverallHabitPct } from "@/lib/calculations";
import type { YearPayload } from "@/types/lifeos";

export interface YearMetrics {
  year: string;
  goalsTotal: number;
  goalsDone: number;
  goalsAvgProgress: number;
  habitsWeeklyPct: number;
  weightStart: number | null;
  weightEnd: number | null;
  weightChange: number | null;
  workoutsCount: number;
  booksDone: number;
  booksTotal: number;
  savingsTotal: number;
  disciplineScore: number;
}

export function computeYearMetrics(year: string, data: YearPayload): YearMetrics {
  const goals = data.goals ?? [];
  const weightLogs = [...(data.weightLogs ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const workouts = data.workoutLogs ?? [];
  const books = data.books ?? [];
  const savings = (data.transactions ?? [])
    .filter((t) => t.type === "saving")
    .reduce((a, b) => a + b.amount, 0);

  const goalsAvg = goals.length
    ? Math.round(goals.reduce((a, g) => a + calcGoalPct(g), 0) / goals.length)
    : 0;

  const weightStart = weightLogs[0]?.weight ?? null;
  const weightEnd = weightLogs[weightLogs.length - 1]?.weight ?? null;

  const habitsWeeklyPct = calcOverallHabitPct(data, 0);
  const disciplineScore = Math.round(
    goalsAvg * 0.4 + habitsWeeklyPct * 0.4 + Math.min(100, workouts.length * 8) * 0.2
  );

  return {
    year,
    goalsTotal: goals.length,
    goalsDone: goals.filter((g) => g.done).length,
    goalsAvgProgress: goalsAvg,
    habitsWeeklyPct,
    weightStart,
    weightEnd,
    weightChange:
      weightStart != null && weightEnd != null ? weightEnd - weightStart : null,
    workoutsCount: workouts.length,
    booksDone: books.filter((b) => b.status === "done").length,
    booksTotal: books.length,
    savingsTotal: savings,
    disciplineScore,
  };
}
