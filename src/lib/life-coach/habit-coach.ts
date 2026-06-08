import type { DashboardInsight } from "@/types/lifeos-pro";
import type { EnrichedHabit, GoalCompletion } from "@/types/para";
import type { BodyAnalytics } from "@/types/para";

export function buildHabitCoachInsights(input: {
  habits: EnrichedHabit[];
  goalCompletions: GoalCompletion[];
  body?: BodyAnalytics;
  proteinDaysMissed?: number;
  savingsRate?: number;
}): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  const missedHighImpact = input.habits.filter(
    (h) => h.impact === "high" && h.active && !h.doneToday && h.adherencePct < 70
  );
  for (const h of missedHighImpact.slice(0, 2)) {
    insights.push({
      id: `habit-miss-${h.id}`,
      icon: "🔄",
      message: `«${h.name}» لم تُنجز اليوم — تؤثر على ${h.goalTitle ?? "هدفك"}`,
      action: "أكمل الآن",
      actionUrl: "/habits",
      priority: h.priority === "critical" ? "urgent" : "high",
    });
  }

  for (const g of input.goalCompletions.filter((x) => x.atRisk).slice(0, 2)) {
    insights.push({
      id: `goal-risk-${g.goalId}`,
      icon: "🎯",
      message: `هدف «${g.title}» — ${g.probabilityText}`,
      action: "راجع الهدف",
      actionUrl: "/goals",
      priority: g.successProbability < 50 ? "urgent" : "high",
    });
  }

  if (input.body && input.body.stagnantWeeks >= 2) {
    insights.push({
      id: "weight-stagnant",
      icon: "⚖️",
      message: `الوزن ثابت منذ ${input.body.stagnantWeeks} أسبوع — راجع السعرات والتمرين`,
      action: "سجّل الوزن",
      actionUrl: "/body",
      priority: "normal",
    });
  }

  if (input.body?.forecastDate && input.body.weeklyGainRate && input.body.weeklyGainRate > 0) {
    insights.push({
      id: "weight-forecast",
      icon: "📈",
      message: `يمكنك الوصول إلى ${input.body.targetWeight} كجم بحلول ${input.body.forecastDate} إذا حافظت على المعدل`,
      action: "عرض التقدم",
      actionUrl: "/body",
      priority: "low",
    });
  }

  if ((input.proteinDaysMissed ?? 0) >= 4) {
    insights.push({
      id: "protein-streak-miss",
      icon: "🥩",
      message: `لم تسجل بروتينك منذ ${input.proteinDaysMissed} أيام`,
      action: "سجّل وجبة",
      actionUrl: "/nutrition",
      priority: "normal",
    });
  }

  if (input.savingsRate != null && input.savingsRate < 10) {
    insights.push({
      id: "savings-below-plan",
      icon: "💰",
      message: `معدل الادخار ${input.savingsRate}% — أقل من الخطة`,
      action: "راجع المالية",
      actionUrl: "/finance",
      priority: "normal",
    });
  }

  return insights;
}
