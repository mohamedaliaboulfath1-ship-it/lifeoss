import type { GoalCompletion } from "@/types/para";

export interface AreaPreview {
  id: string;
  slug: string;
  nameAr: string;
  icon: string;
  color: string;
  healthScore: number;
  scoreReasons: string[];
  activeGoals: number;
  habits: number;
  tasks: number;
  books: number;
  projects: number;
  highlights: { label: string; value: string }[];
  needsAttention: string[];
  currentFocus: string;
  nextAction: string;
}

export interface AreasOverviewStats {
  lifeScore: number;
  activeGoals: number;
  activeProjects: number;
  habits: number;
  tasksThisWeek: number;
  areasNeedingAttention: number;
}

export interface AreasOverviewResponse {
  previews: AreaPreview[];
  stats: AreasOverviewStats;
}

export interface AreaGoalItem {
  id: string;
  title: string;
  progress: number;
  status: string;
  level?: string;
  targetDate?: string;
  completion?: GoalCompletion;
}

export interface AreaTaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  goalId?: string;
}

export interface AreaHabitItem {
  id: string;
  name: string;
  adherencePct: number;
  streak: number;
  doneToday: boolean;
  goalLink?: string;
}

export interface AreaBookItem {
  id: string;
  title: string;
  status: string;
  progress: number;
  author?: string;
}

export interface AreaCourseItem {
  id: string;
  title: string;
  progress: number;
  status: string;
}

export interface AreaCertItem {
  id: string;
  name: string;
  status: string;
  progressPct: number;
}

export interface AreaProjectItem {
  id: string;
  title: string;
  progress: number;
  goalId?: string;
}

export interface KnowledgeGraphNode {
  id: string;
  type: "goal" | "project" | "task" | "habit" | "book" | "course" | "cert" | "skill";
  label: string;
  progress?: number;
}

export interface KnowledgeGraphEdge {
  from: string;
  to: string;
}

export interface AreaTimelineEvent {
  id: string;
  date: string;
  icon: string;
  text: string;
  period: "today" | "week" | "month";
}

export interface AreaCoachInsight {
  id: string;
  icon: string;
  message: string;
  action?: string;
  priority: "high" | "normal" | "low";
}

export interface GoalDrillDown {
  goal: AreaGoalItem;
  vision?: AreaGoalItem;
  projects: AreaProjectItem[];
  tasks: AreaTaskItem[];
  habits: AreaHabitItem[];
  metrics: { label: string; value: string }[];
  forecast?: string;
  notes?: string;
}

export interface AreaHubPayload {
  area: { id: string; slug: string; nameAr: string; icon: string; color: string };
  healthScore: number;
  scoreReasons: string[];
  goals: AreaGoalItem[];
  projects: AreaProjectItem[];
  tasks: AreaTaskItem[];
  tasksDueToday: AreaTaskItem[];
  tasksOverdue: AreaTaskItem[];
  habits: AreaHabitItem[];
  books: { current: AreaBookItem[]; upcoming: AreaBookItem[]; completed: AreaBookItem[] };
  courses: { current: AreaCourseItem[]; next: AreaCourseItem[]; completed: AreaCourseItem[] };
  certifications: { current: AreaCertItem[]; upcoming: AreaCertItem[]; completed: AreaCertItem[] };
  timeline: AreaTimelineEvent[];
  coach: AreaCoachInsight[];
  graph: { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] };
  counts: Record<string, number>;
  metrics: { label: string; value: string }[];
}
