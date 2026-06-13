export interface AreaScoreInput {
  domainId: string;
  goals: { progress?: number; status?: string }[];
  habits: { adherencePct: number }[];
  tasksDone: number;
  tasksTotal: number;
  booksProgress: number[];
  bodyProgress?: number;
  financeScore?: number;
  careerScore?: number;
  learningHours?: number;
}

export type LifeScoreContext = "dashboard" | "analytics" | "areas";

export interface LifeScoreInput {
  context: LifeScoreContext;
  habitPct: number;
  goalPct: number;
  nutritionPct?: number;
  workoutPct?: number;
  taskPct?: number;
  savingsPct?: number;
  financePct?: number;
  learningPct?: number;
  healthPct?: number;
  areaScores?: number[];
}

export interface GoalProgressInput {
  goal: {
    id: string;
    title: string;
    progress?: number;
    status?: string;
    level?: string;
    targetDate?: string | null;
    due?: string | null;
    created_at?: string;
    start?: string | null;
    habitContributionPct?: number;
    taskContributionPct?: number;
    progressContributionPct?: number;
    tasks?: { done?: boolean }[];
  };
  linkedHabits: { id: string; activeDays?: number[] }[];
  logs: Record<string, Record<string, boolean>>;
  linkedTaskDone?: number;
  linkedTaskTotal?: number;
}

export interface HabitScoreInput {
  habitId: string;
  logs: Record<string, Record<string, boolean>>;
  activeDays: number[];
  windowDays?: number;
  impact?: "low" | "medium" | "high";
  weight?: number;
}
