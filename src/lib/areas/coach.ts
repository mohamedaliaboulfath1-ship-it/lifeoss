import type { AreaCoachInsight, AreaGoalItem, AreaHabitItem, AreaTaskItem } from "@/types/areas";

export function buildAreaCoachInsights(input: {
  areaName: string;
  healthScore: number;
  goals: AreaGoalItem[];
  habits: AreaHabitItem[];
  tasksDueToday: AreaTaskItem[];
  tasksOverdue: AreaTaskItem[];
  weeklyDelta?: string;
}): AreaCoachInsight[] {
  const insights: AreaCoachInsight[] = [];

  if (input.weeklyDelta) {
    insights.push({
      id: "weekly-delta",
      icon: "📈",
      message: input.weeklyDelta,
      priority: "normal",
    });
  }

  const atRisk = input.goals.filter((g) => g.completion?.atRisk);
  if (atRisk.length) {
    insights.push({
      id: "goal-at-risk",
      icon: "⚠️",
      message: `الهدف «${atRisk[0].title}» متأخر — ${atRisk[0].completion?.probabilityText ?? ""}`,
      action: "راجع الخطة",
      priority: "high",
    });
  }

  if (input.tasksOverdue.length) {
    insights.push({
      id: "tasks-overdue",
      icon: "⏰",
      message: `${input.tasksOverdue.length} مهمة متأخرة في ${input.areaName}`,
      action: "أكمل المهام",
      priority: "high",
    });
  }

  const weakHabits = [...input.habits].sort((a, b) => a.adherencePct - b.adherencePct);
  if (weakHabits[0] && weakHabits[0].adherencePct < 50) {
    insights.push({
      id: "habit-weak",
      icon: "🔄",
      message: `أكثر عادة تؤثر على تقدمك: «${weakHabits[0].name}» (${weakHabits[0].adherencePct}%)`,
      priority: "normal",
    });
  }

  if (input.healthScore >= 75) {
    insights.push({
      id: "score-good",
      icon: "✨",
      message: `${input.areaName} في مسار قوي — ${input.healthScore}%`,
      priority: "low",
    });
  } else if (input.healthScore < 45) {
    insights.push({
      id: "score-low",
      icon: "🎯",
      message: `ركّز على هدف واحد في ${input.areaName} هذا الأسبوع`,
      priority: "normal",
    });
  }

  if (input.tasksDueToday.length) {
    insights.push({
      id: "tasks-today",
      icon: "📋",
      message: `${input.tasksDueToday.length} مهمة مستحقة اليوم`,
      priority: "normal",
    });
  }

  return insights.slice(0, 5);
}
