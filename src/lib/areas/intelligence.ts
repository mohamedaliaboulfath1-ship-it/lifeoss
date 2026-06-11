import type { AreaCoachInsight } from "@/types/areas";

export interface AreaIntelligenceInput {
  areaSlug: string;
  areaName: string;
  healthScore: number;
  currentWeight?: number | null;
  targetWeight?: number | null;
  weeklyGainTarget?: number;
  proteinTarget?: number;
  proteinToday?: number;
  daysSinceWeightLog?: number;
  goalsAtRisk: number;
  habitsBelow50: string[];
  tasksOverdue: number;
  trajectory?: "up" | "down" | "flat";
}

export function buildAreaIntelligence(input: AreaIntelligenceInput): {
  trajectory: string;
  risks: AreaCoachInsight[];
  opportunities: AreaCoachInsight[];
  recommendations: AreaCoachInsight[];
} {
  const risks: AreaCoachInsight[] = [];
  const opportunities: AreaCoachInsight[] = [];
  const recommendations: AreaCoachInsight[] = [];

  if (input.areaSlug === "body" && input.currentWeight != null && input.targetWeight != null) {
    const gap = input.targetWeight - input.currentWeight;
    const weekly = input.weeklyGainTarget ?? 0.4;
    if (gap > 0) {
      const weeksBehind = weekly > 0 ? Math.max(0, gap / weekly - 4) : 0;
      if (weeksBehind > 2) {
        risks.push({
          id: "weight-behind",
          icon: "⚖️",
          message: `أنت متأخر عن الهدف بـ ${gap.toFixed(1)} كجم — يحتاج ${Math.ceil(gap / weekly)} أسبوع بمعدل +${weekly}`,
          priority: "high",
          action: "راجع الخطة",
        });
      }
    }
    if (input.daysSinceWeightLog != null && input.daysSinceWeightLog >= 5) {
      risks.push({
        id: "no-weight-log",
        icon: "📉",
        message: `لا تسجيل وزن منذ ${input.daysSinceWeightLog} أيام`,
        priority: "high",
        action: "سجّل الوزن",
      });
    }
    if (input.proteinTarget && input.proteinToday != null && input.proteinToday < input.proteinTarget * 0.6) {
      risks.push({
        id: "protein-low",
        icon: "🥩",
        message: `البروتين أقل من الهدف (${Math.round(input.proteinToday)}/${input.proteinTarget}جم)`,
        priority: "normal",
        action: "التغذية",
      });
    }
  }

  if (input.goalsAtRisk > 0) {
    risks.push({
      id: "goals-risk",
      icon: "🎯",
      message: `${input.goalsAtRisk} هدف معرّض للخطر في ${input.areaName}`,
      priority: "high",
    });
  }

  if (input.tasksOverdue > 0) {
    risks.push({
      id: "tasks-overdue",
      icon: "⏰",
      message: `${input.tasksOverdue} مهمة متأخرة`,
      priority: "high",
      action: "المهام",
    });
  }

  for (const h of input.habitsBelow50.slice(0, 2)) {
    recommendations.push({
      id: `habit-${h}`,
      icon: "🔄",
      message: `ركّز على عادة «${h}» — التزام أقل من 50%`,
      priority: "normal",
    });
  }

  if (input.healthScore >= 75) {
    opportunities.push({
      id: "momentum",
      icon: "✨",
      message: `${input.areaName} في مسار قوي — ${input.healthScore}%`,
      priority: "low",
    });
  } else if (input.healthScore < 50) {
    recommendations.push({
      id: "recovery",
      icon: "🎯",
      message: `خطة استعادة: هدف واحد + عادة واحدة + مهمة واحدة هذا الأسبوع`,
      priority: "high",
    });
  }

  const trajectory =
    input.trajectory === "up"
      ? "📈 اتجاه صاعد"
      : input.trajectory === "down"
        ? "📉 يحتاج انتباه"
        : "➡️ مستقر";

  return { trajectory, risks, opportunities, recommendations };
}
