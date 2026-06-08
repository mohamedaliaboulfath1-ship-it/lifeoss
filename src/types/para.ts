import type { LifeDomainId } from "@/types/lifeos-pro";

export type HabitPriority = "low" | "normal" | "high" | "critical";
export type HabitImpact = "low" | "medium" | "high";

export interface EnrichedHabit {
  id: string;
  name: string;
  cat: string;
  freq: string;
  time?: string;
  dur?: number;
  note?: string;
  domainId?: string;
  domainName?: string;
  domainIcon?: string;
  goalId?: string;
  goalTitle?: string;
  projectId?: string;
  projectTitle?: string;
  why?: string;
  stopImpact?: string;
  priority: HabitPriority;
  impact: HabitImpact;
  activeDays: number[];
  lifeScoreWeight: number;
  currentStreak: number;
  bestStreak: number;
  adherencePct: number;
  lifeScoreContribution: number;
  goalImpactPct?: number;
  doneToday: boolean;
  active: boolean;
}

export interface GoalCompletion {
  goalId: string;
  title: string;
  level?: string;
  completionScore: number;
  successProbability: number;
  taskScore: number;
  habitScore: number;
  progressScore: number;
  linkedHabits: number;
  atRisk: boolean;
  probabilityText: string;
}

export interface BodyAnalytics {
  currentWeight: number | null;
  targetWeight: number;
  startWeight: number | null;
  difference: number | null;
  hasWeight?: boolean;
  forecastWeeks?: number | null;
  weeklyGainRate: number | null;
  forecastDate: string | null;
  bmi: number | null;
  bmiLabel: string;
  leanMass: number | null;
  fatMass: number | null;
  progressPct: number;
  stagnantWeeks: number;
  bestImprovedArea: string | null;
  laggingArea: string | null;
  monthlyGrowthRate: Record<string, number>;
}

export interface PersonalizationSettings {
  accentColor?: string;
  domainIcons?: Record<string, string>;
  domainNames?: Record<string, string>;
  dashboardLayout?: string[];
  widgets?: Record<string, boolean>;
  quickActions?: string[];
  sidebarOrder?: string[];
}

export interface ParaArea {
  id: LifeDomainId | string;
  slug: string;
  nameAr: string;
  nameEn?: string;
  icon?: string;
  color?: string;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}
