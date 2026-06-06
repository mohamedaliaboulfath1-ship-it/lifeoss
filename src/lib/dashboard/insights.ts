import type { DashboardInsight } from "@/types/lifeos-pro";

interface InsightContext {
  habitsPending: number;
  habitsTotal: number;
  tasksDue: number;
  atRiskGoals: number;
  weekWorkouts: number;
  weekWorkoutTarget: number;
  todayCalories: number;
  calorieTarget: number;
  todayProtein: number;
  proteinTarget: number;
  savings: number;
  savingsTarget: number;
  latestWeight: number | null;
  targetWeight: number | null;
  learningHoursWeek: number;
  careerTargetRole?: string;
}

export function buildActionableInsights(ctx: InsightContext): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  if (ctx.habitsPending > 0) {
    insights.push({
      id: "habits-pending",
      icon: "🔄",
      message: `${ctx.habitsPending} عادة يومية لم تُنجز بعد — ابدأ بالأولى الآن`,
      action: "أكمل العادات",
      actionUrl: "/habits",
      priority: ctx.habitsPending >= 3 ? "high" : "normal",
    });
  }

  if (ctx.tasksDue > 0) {
    insights.push({
      id: "tasks-due",
      icon: "✅",
      message:
        ctx.tasksDue === 1
          ? "مهمة واحدة مستحقة اليوم — ركّز عليها قبل أي شيء"
          : `${ctx.tasksDue} مهام مستحقة اليوم — رتّبها حسب الأولوية`,
      action: "عرض المهام",
      actionUrl: "/tasks",
      priority: "urgent",
    });
  }

  if (ctx.atRiskGoals > 0) {
    insights.push({
      id: "goals-risk",
      icon: "🎯",
      message: `${ctx.atRiskGoals} هدفاً يحتاج اهتماماً — التقدم أبطأ من الجدول الزمني`,
      action: "راجع الأهداف",
      actionUrl: "/goals",
      priority: "high",
    });
  }

  if (ctx.weekWorkouts < ctx.weekWorkoutTarget) {
    insights.push({
      id: "workouts-week",
      icon: "🏋️",
      message: `${ctx.weekWorkoutTarget - ctx.weekWorkouts} تمارين متبقية هذا الأسبوع (هدف ${ctx.weekWorkoutTarget})`,
      action: "سجّل جلسة",
      actionUrl: "/workouts",
      priority: "normal",
    });
  }

  if (ctx.todayCalories > 0 && ctx.todayCalories < ctx.calorieTarget * 0.6) {
    insights.push({
      id: "calories-low",
      icon: "🍽️",
      message: `السعرات اليوم ${Math.round(ctx.todayCalories)} فقط — الهدف ${ctx.calorieTarget}`,
      action: "سجّل وجبة",
      actionUrl: "/nutrition",
      priority: "normal",
    });
  }

  if (ctx.todayProtein > 0 && ctx.todayProtein < ctx.proteinTarget * 0.7) {
    insights.push({
      id: "protein-low",
      icon: "🥩",
      message: `البروتين ${Math.round(ctx.todayProtein)}جم — تحتاج ${ctx.proteinTarget}جم يومياً`,
      action: "أضف بروتين",
      actionUrl: "/nutrition",
      priority: "normal",
    });
  }

  if (ctx.savings < ctx.savingsTarget * 0.25) {
    insights.push({
      id: "savings-low",
      icon: "💰",
      message: "صندوق الطوارئ أولوية — ادّخر 500 ريال هذا الشهر",
      action: "سجّل ادّخار",
      actionUrl: "/finance",
      priority: "high",
    });
  }

  if (
    ctx.latestWeight &&
    ctx.targetWeight &&
    ctx.latestWeight < ctx.targetWeight - 5
  ) {
    const gap = (ctx.targetWeight - ctx.latestWeight).toFixed(1);
    insights.push({
      id: "weight-gap",
      icon: "⚖️",
      message: `باقي ${gap} كجم للوصول إلى ${ctx.targetWeight} كجم — استمر بالاستمرارية`,
      action: "سجّل الوزن",
      actionUrl: "/body",
      priority: "normal",
    });
  }

  if (ctx.learningHoursWeek < 3 && ctx.careerTargetRole) {
    insights.push({
      id: "learning-hours",
      icon: "📚",
      message: `ساعات التعلم هذا الأسبوع: ${ctx.learningHoursWeek} — استهدف 5+ ساعات نحو ${ctx.careerTargetRole}`,
      action: "جدولة تعلم",
      actionUrl: "/books",
      priority: "normal",
    });
  }

  if (!insights.length) {
    insights.push({
      id: "all-good",
      icon: "✨",
      message: "يوم ممتاز — أنت على المسار في معظم المجالات",
      action: "استمر",
      actionUrl: "/dashboard",
      priority: "low",
    });
  }

  return insights.slice(0, 6);
}
