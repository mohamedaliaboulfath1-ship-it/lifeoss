/** Master production account — data must never be modified by onboarding/demo seeds */
export const SUPER_ADMIN_EMAIL = "mohamedaliabouelfath1@gmail.com";

export const ONBOARDING_SEED_TAG = "onboarding_demo_v1";
export const ONBOARDING_MARKER_GOAL = "demo_goal_welcome";

export type PrimaryGoal =
  | "career_growth"
  | "fitness"
  | "learning"
  | "financial_freedom"
  | "productivity"
  | "entrepreneurship"
  | "balanced_life";

export const PRIMARY_GOAL_OPTIONS: {
  id: PrimaryGoal;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "career_growth",
    label: "نمو مهني",
    icon: "📈",
    description: "مهارات، شهادات، ومسار وظيفي",
  },
  {
    id: "fitness",
    label: "لياقة وصحة",
    icon: "💪",
    description: "وزن، تمارين، وتغذية",
  },
  {
    id: "learning",
    label: "تعلّم مستمر",
    icon: "📚",
    description: "كتب، دورات، ومسارات دراسية",
  },
  {
    id: "financial_freedom",
    label: "حرية مالية",
    icon: "💰",
    description: "ميزانية، ادخار، وثروة",
  },
  {
    id: "productivity",
    label: "إنتاجية",
    icon: "⚡",
    description: "مهام، عادات، وتركيز",
  },
  {
    id: "entrepreneurship",
    label: "ريادة أعمال",
    icon: "🚀",
    description: "مشاريع، أهداف، وتنفيذ",
  },
  {
    id: "balanced_life",
    label: "حياة متوازنة",
    icon: "⚖️",
    description: "مزيج من كل المجالات",
  },
];

export interface WelcomeChecklist {
  profile: boolean;
  goal: boolean;
  habit: boolean;
  task: boolean;
  book: boolean;
  project: boolean;
  areaLink: boolean;
}

export interface SaasMetadata {
  plan?: "free" | "pro" | "enterprise";
  onboardingCompleted?: boolean;
  primaryGoal?: PrimaryGoal | null;
  welcomeChecklist?: WelcomeChecklist;
  toursCompleted?: string[];
  demoSeeded?: boolean;
  tenantId?: string;
  workspaceId?: string;
}

export function defaultWelcomeChecklist(): WelcomeChecklist {
  return {
    profile: false,
    goal: false,
    habit: false,
    task: false,
    book: false,
    project: false,
    areaLink: false,
  };
}

export function parseSaasMetadata(
  metadata: Record<string, unknown> | null | undefined
): SaasMetadata {
  const saas = (metadata?.saas as SaasMetadata | undefined) ?? {};
  return {
    plan: saas.plan ?? "free",
    onboardingCompleted: saas.onboardingCompleted ?? false,
    primaryGoal: saas.primaryGoal ?? null,
    welcomeChecklist: { ...defaultWelcomeChecklist(), ...saas.welcomeChecklist },
    toursCompleted: saas.toursCompleted ?? [],
    demoSeeded: saas.demoSeeded ?? false,
    tenantId: saas.tenantId,
    workspaceId: saas.workspaceId,
  };
}
