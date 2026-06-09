/** LifeOS Pro schema types — aligned with migration 005 */

export type LifeDomainId =
  | "domain_body"
  | "domain_finance"
  | "domain_career"
  | "domain_learning"
  | "domain_relationships"
  | "domain_spiritual"
  | "domain_self_dev"
  | "domain_discipline";

export type TimeHorizonId =
  | "horizon_life_vision"
  | "horizon_3y"
  | "horizon_annual"
  | "horizon_quarterly"
  | "horizon_monthly";

export type GoalLevel = "vision" | "goal" | "project";

export type GoalStatus = "active" | "done" | "paused" | "cancelled";

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "complete"
  | "archive"
  | "restore";

export type NotificationType =
  | "alert"
  | "insight"
  | "reminder"
  | "deadline"
  | "achievement"
  | "system";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface LifeDomain {
  id: LifeDomainId | string;
  slug: string;
  nameEn: string;
  nameAr: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  scoreWeight: number;
  isSystem: boolean;
}

export interface TimeHorizon {
  id: TimeHorizonId;
  slug: string;
  nameEn: string;
  nameAr: string;
  sortOrder: number;
  daysApprox?: number;
}

/** Vision → Goal → Project hierarchy */
export interface LifeObjective {
  id: string;
  userId: string;
  domainId: LifeDomainId | string;
  parentId?: string;
  level: GoalLevel;
  timeHorizonId?: TimeHorizonId;
  title: string;
  description?: string;
  why?: string;
  successCriteria?: string;
  status: GoalStatus;
  progress: number;
  priority: "high" | "med" | "low";
  targetDate?: string;
  legacyId?: number;
  metadata?: Record<string, unknown>;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  domainId?: string;
  action: ActivityAction;
  summary?: string;
  changes?: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body?: string;
  domainId?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  readAt?: string;
  dismissedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface DailyScores {
  scoreDate: string;
  disciplineScore?: number;
  healthScore?: number;
  financeScore?: number;
  learningScore?: number;
  careerScore?: number;
  relationshipsScore?: number;
  spiritualScore?: number;
  lifeScore?: number;
  factors: Record<string, unknown>;
}

/** 30-second dashboard — single answer surface */
export interface DashboardPriority {
  rank: number;
  type: "task" | "habit" | "goal" | "notification" | "insight";
  urgency: NotificationPriority;
  title: string;
  subtitle?: string;
  actionUrl: string;
  domainId?: string;
  entityId?: string;
}

export interface DashboardHabitToday {
  id: string;
  name: string;
  done: boolean;
  category?: string;
  timeOfDay?: string;
  scheduleLabel?: string;
}

export interface DashboardMissedHabit {
  id: string;
  name: string;
  missedDate: string;
  daysAgo: number;
  scheduleLabel?: string;
}

export interface DashboardTaskToday {
  id: string;
  title: string;
  priority: string;
  dueDate?: string;
  status: string;
}

export interface DashboardAtRiskGoal {
  id: string;
  title: string;
  progress: number;
  targetDate?: string;
  probabilityText: string;
  probabilityClass: string;
  daysLeft?: number;
}

export interface DashboardWeight {
  current: number | null;
  start: number | null;
  target: number | null;
  progressPct: number;
  changeFromStart?: number;
}

export interface DashboardNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
}

export interface DashboardWorkouts {
  weekSessions: number;
  weekTarget: number;
  uniqueDays: number;
  lastSessionDate?: string;
}

export interface DashboardFinance {
  monthIncome: number;
  monthExpense: number;
  monthSavings: number;
  netMonth: number;
  totalSavings: number;
  activeDebts: number;
  debtRemaining: number;
}

export interface DashboardInsight {
  id: string;
  icon: string;
  message: string;
  action: string;
  actionUrl: string;
  priority: NotificationPriority;
}

export interface DashboardCareerSummary {
  currentRole: string;
  targetRole: string;
  transformationProgress: number;
  primaryGoalTitle?: string;
  skills: Array<{ id: string; name: string; level: number; target: number; hours: number }>;
  certifications: Array<{ id: string; name: string; status: string; issuer?: string }>;
  learningHoursWeek: number;
  learningHoursTarget: number;
}

export interface DashboardSnapshot {
  greeting: string;
  subtitle: string;
  dayProgress: number;
  yearProgress: number;
  priorities: DashboardPriority[];
  todayHabits: DashboardHabitToday[];
  missedHabits: DashboardMissedHabit[];
  tasksDueToday: DashboardTaskToday[];
  tasksDueSoon: DashboardTaskToday[];
  weekSummary: {
    habitPct: number;
    workoutsDays: number;
    workoutsTarget: number;
    goalsAvgProgress: number;
    tasksCompletedEstimate: number;
  };
  atRiskGoals: DashboardAtRiskGoal[];
  weight: DashboardWeight;
  nutrition: DashboardNutrition;
  workouts: DashboardWorkouts;
  finance: DashboardFinance;
  career: DashboardCareerSummary;
  insights: DashboardInsight[];
  scores: Partial<DailyScores>;
  counts: {
    tasksDueToday: number;
    habitsPendingToday: number;
    habitsDoneToday: number;
    habitsMissed: number;
    goalsAtRisk: number;
    unreadNotifications: number;
  };
  domains: Array<{
    domainId: string;
    slug: string;
    nameAr: string;
    icon?: string;
    score?: number;
    headline?: string;
  }>;
}

export type JobApplicationStatus =
  | "wishlist"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "accepted"
  | "withdrawn";

export interface CareerProfile {
  currentRole?: string;
  targetRole?: string;
  targetSalary?: number;
  transformationNarrative?: string;
  targetDate?: string;
}
