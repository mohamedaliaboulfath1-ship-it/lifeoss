export type TimeBlockType = "task" | "habit" | "deep_work" | "personal" | "meeting" | "break";
export type TimeBlockStatus = "planned" | "in_progress" | "done" | "missed" | "rescheduled";
export type FocusSessionType = "pomodoro_25" | "pomodoro_50" | "deep_90" | "deep_120" | "deep_work" | "custom";
export type HabitPreferredTime = "morning" | "afternoon" | "evening" | "night";

export interface UserTimeSettings {
  sleepHours: number;
  commuteMinutes: number;
  workDays: number[];
  workStart: string;
  workEnd: string;
  satWorkEnabled: boolean;
  satWorkStart: string;
  satWorkEnd: string;
  friOff: boolean;
  homeArrival: string;
  timezone: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  blockType: TimeBlockType;
  status: TimeBlockStatus;
  domainId?: string;
  goalId?: string;
  projectId?: string;
  taskId?: string;
  habitId?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  isRecurring: boolean;
  recurringRule?: Record<string, unknown>;
  allowDuringWork: boolean;
  color?: string;
  notes?: string;
}

export interface FocusSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes: number;
  sessionType: FocusSessionType;
  domainId?: string;
  goalId?: string;
  taskId?: string;
  timeBlockId?: string;
  interrupted: boolean;
  focusScore?: number;
  notes?: string;
}

export interface DailyCapacity {
  date: string;
  totalWakingHours: number;
  workHours: number;
  commuteHours: number;
  fixedHours: number;
  availableHours: number;
  plannedHours: number;
  loggedHours: number;
  remainingHours: number;
}

export interface WeeklyCapacity {
  weekStart: string;
  totalAvailableHours: number;
  totalPlannedHours: number;
  totalLoggedHours: number;
  byDomain: DomainTimeAllocation[];
}

export interface DomainTimeAllocation {
  domainId: string;
  slug: string;
  nameAr: string;
  color: string;
  plannedMinutes: number;
  actualMinutes: number;
  plannedPct: number;
  actualPct: number;
}

export interface GoalTimeForecast {
  goalId: string;
  title: string;
  requiredHours: number;
  loggedHours: number;
  remainingHours: number;
  weeklyPaceHours: number;
  expectedWeeks: number | null;
  expectedDate: string | null;
  riskLevel: "low" | "medium" | "high";
}

export interface TimeHeatmapCell {
  date: string;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface FocusScoreBreakdown {
  score: number;
  deepWorkPct: number;
  blockAdherencePct: number;
  planAdherencePct: number;
  interruptionPenalty: number;
  reasons: string[];
}

export interface TimeOverviewPayload {
  settings: UserTimeSettings;
  todayCapacity: DailyCapacity;
  weeklyCapacity: WeeklyCapacity;
  allocations: DomainTimeAllocation[];
  focusScore: FocusScoreBreakdown;
  deepWorkHours: { week: number; month: number; year: number };
  heatmap: TimeHeatmapCell[];
  goalForecasts: GoalTimeForecast[];
  burnoutRisk: "low" | "medium" | "high";
  overcommitmentRisk: "low" | "medium" | "high";
  utilizationPct: number;
  missedBlocks: TimeBlock[];
}

export interface SuggestedSlot {
  startAt: string;
  endAt: string;
  dayLabel: string;
  reason: string;
}
