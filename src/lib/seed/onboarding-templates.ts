import type { PrimaryGoal } from "@/lib/tenant/constants";
import { ONBOARDING_MARKER_GOAL, ONBOARDING_SEED_TAG } from "@/lib/tenant/constants";

const YEAR = String(new Date().getFullYear());
const DEMO = { isDemo: true, seedTag: ONBOARDING_SEED_TAG };

export interface OnboardingPayload {
  goals: Record<string, unknown>[];
  habits: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  books: Record<string, unknown>[];
  skills: Record<string, unknown>[];
  learningPaths: Record<string, unknown>[];
  savingsGoals: Record<string, unknown>[];
  profilePatches: Record<string, unknown>;
}

function baseDemo(userId: string): OnboardingPayload {
  return {
    goals: [
      {
        id: ONBOARDING_MARKER_GOAL,
        user_id: userId,
        year: YEAR,
        title: "🎯 هدفك الأول — مثال توضيحي",
        area: "prod",
        priority: "high",
        status: "active",
        level: "goal",
        description: "هذا هدف تجريبي — عدّله أو احذفه وابدأ أهدافك الحقيقية",
        why: "الأهداف الواضحة تحوّل النية إلى خطة",
        current_val: "0",
        target_val: "100",
        unit: "%",
        metadata: DEMO,
      },
      {
        id: "demo_project_starter",
        user_id: userId,
        year: YEAR,
        title: "📁 مشروع تجريبي — نظامك الشخصي",
        area: "prod",
        priority: "med",
        status: "active",
        level: "project",
        parent_id: ONBOARDING_MARKER_GOAL,
        description: "مثال على مشروع مرتبط بهدف — جرّب الربط بين PARA والأهداف",
        metadata: DEMO,
      },
    ],
    habits: [
      {
        id: "demo_habit_morning",
        user_id: userId,
        year: YEAR,
        name: "☀️ مراجعة صباحية (مثال)",
        cat: "prod",
        freq: "daily",
        time: "07:00",
        goal_id: ONBOARDING_MARKER_GOAL,
        note: "عادة تجريبية — 5 دقائق لتخطيط اليوم",
        metadata: DEMO,
      },
    ],
    tasks: [
      {
        id: "demo_task_explore",
        user_id: userId,
        title: "استكشف لوحة التحكم",
        status: "todo",
        priority: "high",
        goal_id: ONBOARDING_MARKER_GOAL,
        due_date: new Date().toISOString().slice(0, 10),
        metadata: DEMO,
      },
      {
        id: "demo_task_profile",
        user_id: userId,
        title: "أكمل ملفك الشخصي",
        status: "todo",
        priority: "med",
        metadata: DEMO,
      },
    ],
    books: [
      {
        id: "demo_book_atomic",
        user_id: userId,
        title: "Atomic Habits",
        author: "James Clear",
        category: "إنتاجية",
        status: "planned",
        priority: "high",
        pages_total: 320,
        metadata: { ...DEMO, coverUrl: "https://covers.openlibrary.org/b/id/12816265-L.jpg" },
      },
    ],
    skills: [],
    learningPaths: [],
    savingsGoals: [],
    profilePatches: {},
  };
}

const GOAL_EXTENSIONS: Record<PrimaryGoal, (base: OnboardingPayload, userId: string) => OnboardingPayload> = {
  career_growth: (base, userId) => ({
    ...base,
    goals: [
      ...base.goals,
      {
        id: "demo_goal_career",
        user_id: userId,
        year: YEAR,
        title: "📈 تطوير مهني — مثال",
        area: "career",
        priority: "high",
        status: "active",
        level: "goal",
        description: "هدف تجريبي لمسارك المهني",
        metadata: DEMO,
      },
    ],
    habits: [
      ...base.habits,
      {
        id: "demo_habit_skill",
        user_id: userId,
        year: YEAR,
        name: "📖 30 دقيقة تعلّم مهارة",
        cat: "learn",
        freq: "daily",
        goal_id: "demo_goal_career",
        metadata: DEMO,
      },
    ],
    skills: [
      {
        id: "demo_skill_leadership",
        user_id: userId,
        name: "القيادة",
        category: "soft",
        current_level: 2,
        target_level: 4,
        metadata: DEMO,
      },
    ],
    learningPaths: [
      {
        id: "demo_path_career",
        user_id: userId,
        title: "مسار مهني تجريبي",
        progress: 0,
        metadata: { ...DEMO, description: "مثال على مسار تعلّم مرتبط بالمهنة" },
      },
    ],
  }),

  fitness: (base, userId) => ({
    ...base,
    goals: [
      ...base.goals,
      {
        id: "demo_goal_fitness",
        user_id: userId,
        year: YEAR,
        title: "💪 تحسين اللياقة — مثال",
        area: "body",
        priority: "high",
        status: "active",
        level: "goal",
        current_val: "0",
        target_val: "5",
        unit: "كجم",
        metadata: DEMO,
      },
    ],
    habits: [
      ...base.habits,
      {
        id: "demo_habit_workout",
        user_id: userId,
        year: YEAR,
        name: "🏋️ تمرين يومي",
        cat: "body",
        freq: "daily",
        goal_id: "demo_goal_fitness",
        metadata: DEMO,
      },
      {
        id: "demo_habit_water",
        user_id: userId,
        year: YEAR,
        name: "💧 شرب الماء",
        cat: "body",
        freq: "daily",
        metadata: DEMO,
      },
    ],
    profilePatches: {
      body_goal: "gain",
      weekly_gain_target: 0.25,
      water_target_ml: 3000,
    },
  }),

  learning: (base, userId) => ({
    ...base,
    books: [
      ...base.books,
      {
        id: "demo_book_deep",
        user_id: userId,
        title: "Deep Work",
        author: "Cal Newport",
        category: "إنتاجية",
        status: "planned",
        priority: "med",
        pages_total: 296,
        metadata: { ...DEMO, coverUrl: "https://covers.openlibrary.org/b/id/8228691-L.jpg" },
      },
      {
        id: "demo_book_mindset",
        user_id: userId,
        title: "Mindset",
        author: "Carol Dweck",
        category: "نمو شخصي",
        status: "planned",
        priority: "low",
        pages_total: 320,
        metadata: { ...DEMO, coverUrl: "https://covers.openlibrary.org/b/id/8739161-L.jpg" },
      },
    ],
    habits: [
      ...base.habits,
      {
        id: "demo_habit_read",
        user_id: userId,
        year: YEAR,
        name: "📚 قراءة 20 صفحة",
        cat: "learn",
        freq: "daily",
        metadata: DEMO,
      },
    ],
    learningPaths: [
      {
        id: "demo_path_reading",
        user_id: userId,
        title: "خطة قراءة تجريبية",
        progress: 0,
        metadata: { ...DEMO, description: "12 كتاباً في السنة — مثال" },
      },
    ],
  }),

  financial_freedom: (base, userId) => ({
    ...base,
    goals: [
      ...base.goals,
      {
        id: "demo_goal_finance",
        user_id: userId,
        year: YEAR,
        title: "💰 بناء صندوق طوارئ — مثال",
        area: "finance",
        priority: "high",
        status: "active",
        level: "goal",
        current_val: "0",
        target_val: "10000",
        unit: "ر.س",
        metadata: DEMO,
      },
    ],
    habits: [
      ...base.habits,
      {
        id: "demo_habit_save",
        user_id: userId,
        year: YEAR,
        name: "💵 ادخار يومي",
        cat: "finance",
        freq: "daily",
        goal_id: "demo_goal_finance",
        metadata: DEMO,
      },
    ],
    savingsGoals: [
      {
        id: "demo_savings_emergency",
        user_id: userId,
        name: "صندوق طوارئ تجريبي",
        target_amount: 10000,
        current_amount: 0,
        metadata: DEMO,
      },
    ],
  }),

  productivity: (base, userId) => ({
    ...base,
    habits: [
      ...base.habits,
      {
        id: "demo_habit_deepwork",
        user_id: userId,
        year: YEAR,
        name: "🎯 ساعة Deep Work",
        cat: "prod",
        freq: "daily",
        goal_id: ONBOARDING_MARKER_GOAL,
        metadata: DEMO,
      },
      {
        id: "demo_habit_review",
        user_id: userId,
        year: YEAR,
        name: "📔 مراجعة مسائية",
        cat: "prod",
        freq: "daily",
        metadata: DEMO,
      },
    ],
    tasks: [
      ...base.tasks,
      {
        id: "demo_task_big3",
        user_id: userId,
        title: "حدد 3 مهام كبيرة لليوم",
        status: "todo",
        priority: "high",
        metadata: DEMO,
      },
    ],
  }),

  entrepreneurship: (base, userId) => ({
    ...base,
    goals: [
      ...base.goals,
      {
        id: "demo_goal_startup",
        user_id: userId,
        year: YEAR,
        title: "🚀 مشروع جانبي — مثال",
        area: "prod",
        priority: "high",
        status: "active",
        level: "goal",
        description: "هدف تجريبي لريادة الأعمال",
        metadata: DEMO,
      },
    ],
    tasks: [
      ...base.tasks,
      {
        id: "demo_task_mvp",
        user_id: userId,
        title: "صِغ فكرة MVP",
        status: "todo",
        priority: "high",
        goal_id: "demo_goal_startup",
        metadata: DEMO,
      },
      {
        id: "demo_task_customer",
        user_id: userId,
        title: "تحدّث مع 3 عملاء محتملين",
        status: "todo",
        priority: "med",
        goal_id: "demo_goal_startup",
        metadata: DEMO,
      },
    ],
    habits: [
      ...base.habits,
      {
        id: "demo_habit_ship",
        user_id: userId,
        year: YEAR,
        name: "📦 شحن شيء واحد يومياً",
        cat: "prod",
        freq: "daily",
        goal_id: "demo_goal_startup",
        metadata: DEMO,
      },
    ],
  }),

  balanced_life: (base) => ({
    ...base,
    habits: [
      ...base.habits,
      {
        id: "demo_habit_balance_body",
        user_id: base.goals[0]?.user_id,
        year: YEAR,
        name: "🚶 نشاط جسدي",
        cat: "body",
        freq: "daily",
        metadata: DEMO,
      },
      {
        id: "demo_habit_balance_learn",
        user_id: base.goals[0]?.user_id,
        year: YEAR,
        name: "📖 تعلّم 15 دقيقة",
        cat: "learn",
        freq: "daily",
        metadata: DEMO,
      },
    ],
  }),
};

export function buildOnboardingPayload(
  userId: string,
  primaryGoal: PrimaryGoal
): OnboardingPayload {
  const base = baseDemo(userId);
  const extend = GOAL_EXTENSIONS[primaryGoal];
  return extend(base, userId);
}
