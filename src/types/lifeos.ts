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

export type GoalStatus = "active" | "done" | "paused" | "cancelled";
export type GoalLevel = "vision" | "goal" | "project";

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
  /** LifeOS Pro fields */
  status?: GoalStatus;
  progress?: number;
  category?: string;
  description?: string;
  why?: string;
  successCriteria?: string;
  level?: GoalLevel;
  parentId?: string;
  targetDate?: string;
  domainId?: string;
  createdAt?: string;
  completionScore?: number;
  habitContributionPct?: number;
  taskContributionPct?: number;
  progressContributionPct?: number;
}

/** Goal with required Pro fields for Kanban / probability */
export type ProGoal = Goal & {
  status: GoalStatus;
  progress: number;
};

export interface Habit {
  id: string;
  name: string;
  cat: string;
  freq: string;
  time?: string;
  dur?: number;
  goalLink?: string;
  note?: string;
  domainId?: string;
  projectId?: string;
  why?: string;
  stopImpact?: string;
  priority?: "low" | "normal" | "high" | "critical";
  impact?: "low" | "medium" | "high";
  activeDays?: number[];
  lifeScoreWeight?: number;
  active?: boolean;
  bestStreak?: number;
  streak?: number;
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  sleep?: number;
  cals?: number;
  note?: string;
}

export interface BookHighlight {
  id?: string;
  excerpt?: string;
  note?: string;
  page?: number;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  field?: string;
  category?: string;
  pages?: number;
  curPage?: number;
  month?: number;
  priority?: Priority;
  status?: "planned" | "reading" | "done";
  notes?: string;
  bookType?: string;
  coverPath?: string;
  coverUrl?: string;
  highlights?: BookHighlight[];
  rating?: number;
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

export interface LifeTask {
  id: string;
  title: string;
  goalId?: string;
  status: "inbox" | "active" | "done" | "archive";
  priority?: "p1" | "p2" | "p3" | "p4";
  dueDate?: string;
  estimatedTime?: number;
  completedDate?: string;
  note?: string;
}

export interface Measurement {
  id: string;
  date: string;
  chest?: number;
  waist?: number;
  arm?: number;
  thigh?: number;
  calf?: number;
  bodyFat?: number;
  note?: string;
}

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving?: string;
}

export interface MealLog {
  id: string;
  date: string;
  mealName?: string;
  foodName?: string;
  time?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
  equipment?: string;
}

export interface WorkoutSetLog {
  id: string;
  date: string;
  exerciseId?: string;
  exerciseName?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  notes?: string;
}

export interface Debt {
  id: string;
  name: string;
  total: number;
  paid: number;
  monthlyPayment?: number;
  dueDate?: string;
}

export interface DailyJournal {
  id: string;
  date: string;
  mood?: number;
  energy?: number;
  note?: string;
}

export interface PeriodReview {
  id: string;
  period: string;
  type: "weekly" | "monthly" | "quarterly" | "annual";
  wins?: string;
  challenges?: string;
  lessons?: string;
  nextFocus?: string;
}

export interface CareerRoadmapStage {
  id: string;
  title: string;
  from?: string;
  to?: string;
  focus: string[];
  targetDate?: string;
  salaryRange?: string;
  description?: string;
  requirements?: string[];
  requiredSkills?: string[];
  requiredCerts?: string[];
  requiredExperience?: string;
  requiredProjects?: string[];
  successCriteria?: string;
  status?: "planned" | "active" | "done" | "paused";
  progressPct?: number;
  stageOrder?: number;
}

export interface CareerSkillMatrixItem {
  id: string;
  name: string;
  current: number;
  target: number;
  manualScore?: number;
  evidenceScore?: number;
  scoringMode?: "manual" | "evidence" | "hybrid";
  category: string;
}

export interface CareerCertification {
  id: string;
  name: string;
  provider: string;
  status: "planned" | "studying" | "registered" | "passed" | "expired" | "active" | "done";
  dueDate?: string;
  startDate?: string;
  cost?: number;
  hours?: number;
  difficulty?: string;
  progressPct?: number;
  notes?: string;
  priority?: string;
  careerImpactScore?: number;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description?: string;
  skillsUsed: string[];
  url?: string;
  files?: string[];
  links?: string[];
  outcome?: string;
  lessonsLearned?: string;
  careerImpact?: number;
  status: "planned" | "active" | "done" | "paused";
  startDate?: string;
  finishDate?: string;
}

export interface CareerProfile {
  currentRole?: string;
  targetRole?: string;
  targetSalary?: number;
  narrative?: string;
  targetDate?: string;
}

export interface CareerCourse {
  id: string;
  title: string;
  platform?: string;
  progress: number;
  hours: number;
  status: "planned" | "active" | "done";
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status:
    | "wishlist"
    | "applied"
    | "screening"
    | "interview"
    | "offer"
    | "rejected"
    | "accepted";
  appliedAt?: string;
}

export interface InterviewEntry {
  id: string;
  company: string;
  stage: string;
  date: string;
  result?: "pending" | "passed" | "failed";
}

export interface MentorEntry {
  id: string;
  name: string;
  area: string;
  cadence: string;
  lastTouch?: string;
}

export interface NetworkContact {
  id: string;
  name: string;
  company?: string;
  role?: string;
  channel: "linkedin" | "email" | "phone" | "event";
  lastContact?: string;
  nextFollowUp?: string;
}

export interface StudySession {
  id: string;
  topic: string;
  date: string;
  durationMin: number;
  focus: number;
}

export interface KnowledgeArea {
  id: string;
  name: string;
  progress: number;
  target: number;
}

export interface YearPayload {
  goals: Goal[];
  habits: Habit[];
  habitLogs: Record<string, Record<string, boolean>>;
  weightLogs: WeightLog[];
  measureLogs: Measurement[];
  workoutLogs: WorkoutSetLog[];
  books: Book[];
  transactions: Transaction[];
  skills: Skill[];
  portfolio: unknown[];
  reviews: PeriodReview[];
  pomSessions: unknown[];
  milestones: Milestone[];
  timeslots: Record<string, unknown>;
  identity: IdentityData;
  energy: unknown[];
  tasks: LifeTask[];
  foods: Food[];
  mealLogs: MealLog[];
  exercises: Exercise[];
  debts: Debt[];
  dailyJournals: DailyJournal[];
  careerRoadmap?: CareerRoadmapStage[];
  careerSkillMatrix?: CareerSkillMatrixItem[];
  careerCertifications?: CareerCertification[];
  careerCourses?: CareerCourse[];
  careerPortfolio?: PortfolioProject[];
  careerProfile?: CareerProfile | null;
  jobApplications?: JobApplication[];
  interviews?: InterviewEntry[];
  mentors?: MentorEntry[];
  networkContacts?: NetworkContact[];
  learningPaths?: { id: string; title: string; progress: number; targetDate?: string }[];
  learningCourses?: CareerCourse[];
  learningCertifications?: CareerCertification[];
  studySessions?: StudySession[];
  knowledgeAreas?: KnowledgeArea[];
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
