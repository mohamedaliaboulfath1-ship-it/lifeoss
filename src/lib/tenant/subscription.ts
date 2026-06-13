export type SubscriptionPlan = "free" | "pro" | "enterprise";

export interface PlanDefinition {
  id: SubscriptionPlan;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export const SUBSCRIPTION_PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    price: "0 ر.س",
    description: "كل الوحدات الأساسية — مثالي للبداية",
    features: [
      "لوحة التحكم والأهداف",
      "العادات والمهام",
      "المكتبة والتعلّم",
      "المال والجسد",
      "المراجعات اليومية",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "قريباً",
    description: "تحليلات متقدمة وذكاء اصطناعي موسّع",
    highlighted: true,
    features: [
      "كل ميزات Free",
      "AI Coach غير محدود",
      "تقارير تنفيذية متقدمة",
      "تصدير PDF وExcel",
      "أولوية دعم",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "تواصل معنا",
    description: "فرق ومنظمات — عزل متقدم وإدارة",
    features: [
      "كل ميزات Pro",
      "مساحات عمل متعددة",
      "SSO وإدارة فريق",
      "SLA مخصص",
      "تكامل API",
    ],
  },
];

/** Feature flags — billing not active yet */
export const FEATURE_FLAGS = {
  billingEnabled: false,
  aiCoachUnlimited: (plan: SubscriptionPlan) => plan !== "free",
  advancedAnalytics: (plan: SubscriptionPlan) => plan === "pro" || plan === "enterprise",
  pdfExport: (plan: SubscriptionPlan) => plan !== "free",
  multiWorkspace: (plan: SubscriptionPlan) => plan === "enterprise",
  guidedTours: () => true,
  wisdomWidget: () => true,
  onboardingTemplates: () => true,
} as const;

export function getUserPlan(
  plan: SubscriptionPlan | string | undefined
): SubscriptionPlan {
  if (plan === "pro" || plan === "enterprise") return plan;
  return "free";
}

export function hasFeature(
  plan: SubscriptionPlan | string | undefined,
  feature: keyof typeof FEATURE_FLAGS
): boolean {
  const resolved = getUserPlan(plan);
  const flag = FEATURE_FLAGS[feature];
  if (typeof flag === "function") {
    return (flag as (p: SubscriptionPlan) => boolean)(resolved);
  }
  return flag;
}
