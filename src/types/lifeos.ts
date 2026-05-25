export type GoalArea =
  | "body"
  | "finance"
  | "career"
  | "mind"
  | "spirit"
  | "relation"
  | "self";

export type Priority = "high" | "med" | "low";

export interface GoalTask {
  id: string;
  text: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  area: GoalArea;
  priority: Priority;
  start?: string;
  due?: string;
  current?: string;
  target?: string;
  startVal?: string;
  unit?: string;
  done?: boolean;
  tasks?: GoalTask[];
  habits?: string;
}

export interface Habit {
  id: string;
  name: string;
  cat: string;
  freq: string;
  time?: string;
  dur?: number;
  goalLink?: string;
  note?: string;
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  sleep?: number;
  cals?: number;
  note?: string;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  field?: string;
  pages?: number;
  curPage?: number;
  month?: number;
  priority?: Priority;
  status?: "planned" | "reading" | "done";
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: "income" | "expense" | "saving";
  amount: number;
  cat: string;
  note?: string;
}

export interface Skill {
  id: string;
  name: string;
  platform?: string;
  hours?: number;
  done?: number;
  status: "planned" | "active" | "done" | "paused";
}

export interface Milestone {
  id: string;
  title: string;
  cat?: string;
  date?: string;
  reward?: string;
}

export interface IdentityData {
  traits: string[];
  rules: string[];
}

export interface YearPayload {
  goals: Goal[];
  habits: Habit[];
  habitLogs: Record<string, Record<string, boolean>>;
  weightLogs: WeightLog[];
  measureLogs: unknown[];
  workoutLogs: unknown[];
  books: Book[];
  transactions: Transaction[];
  skills: Skill[];
  portfolio: unknown[];
  reviews: unknown[];
  pomSessions: unknown[];
  milestones: Milestone[];
  timeslots: Record<string, unknown>;
  identity: IdentityData;
  energy: unknown[];
}

export interface UserProfile {
  name: string;
  city?: string;
  age?: number;
  height?: number;
  startWeight?: number;
  targetWeight?: number;
  salary?: number;
  targetSalary?: number;
  startDate?: string;
}

export interface NavPage {
  id: string;
  href: string;
  icon: string;
  title: string;
  sub: string;
  section?: string;
}
