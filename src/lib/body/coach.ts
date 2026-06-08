import type { DashboardInsight } from "@/types/lifeos-pro";
import type { WeightLog, Measurement } from "@/types/lifeos";
import { weightForecast } from "@/lib/body/weight-forecast";

export function buildBodyCoachInsights(input: {
  weightLogs: WeightLog[];
  measurements: Measurement[];
  current: number | null;
  target: number;
  weeklyRate: number;
  bodyGoal?: string;
}): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  const logs = [...input.weightLogs].sort((a, b) => a.date.localeCompare(b.date));

  if (input.current == null) {
    insights.push({
      id: "weight-missing",
      icon: "⚖️",
      message: "لم يتم تسجيل الوزن بعد — أدخل وزنك الحالي لبدء التتبع",
      action: "سجّل الوزن",
      actionUrl: "/body",
      priority: "high",
    });
    return insights;
  }

  if (logs.length >= 2) {
    const last = logs[logs.length - 1].weight;
    const prev = logs[logs.length - 2].weight;
    const delta = Math.round((last - prev) * 10) / 10;
    if (Math.abs(delta) >= 0.3) {
      insights.push({
        id: "weight-recent-delta",
        icon: delta > 0 ? "📈" : "📉",
        message:
          delta > 0
            ? `ممتاز — ${delta > 0 ? "+" : ""}${delta} كجم منذ آخر تسجيل`
            : `انخفض الوزن ${Math.abs(delta)} كجم — راجع الخطة`,
        action: "عرض التحليل",
        actionUrl: "/body",
        priority: "normal",
      });
    }
  }

  if (logs.length >= 3) {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
    const old = logs.find((l) => l.date <= twoWeeksAgo)?.weight ?? logs[0].weight;
    const gain14 = Math.round((input.current - old) * 10) / 10;
    if (gain14 >= 0.5) {
      insights.push({
        id: "weight-14d-gain",
        icon: "💪",
        message: `اكتسبت ${gain14} كجم خلال آخر 14 يوم`,
        action: "قارن الصور",
        actionUrl: "/body",
        priority: "normal",
      });
    }
  }

  const forecast = weightForecast({
    current: input.current,
    target: input.target,
    weeklyRate: input.weeklyRate,
  });

  if (forecast.weeks != null && input.bodyGoal === "gain") {
    insights.push({
      id: "weight-eta",
      icon: "🎯",
      message: `إذا استمر المعدل ${input.weeklyRate} كجم/أسبوع، تصل إلى ${input.target} كجم خلال ${forecast.weeks} أسبوع`,
      action: "عرض التوقع",
      actionUrl: "/body",
      priority: "low",
    });
  }

  const observed = logs.length >= 2
    ? logs[logs.length - 1].weight - logs[logs.length - 2].weight
    : 0;
  if (input.weeklyRate > 0 && observed > input.weeklyRate * 1.4) {
    insights.push({
      id: "weight-fast-gain",
      icon: "⚠️",
      message: "معدل الزيادة أسرع من الخطة — راقب دهون الجسم",
      action: "تعديل المعدل",
      actionUrl: "/body",
      priority: "normal",
    });
  }

  const measures = [...input.measurements].sort((a, b) => a.date.localeCompare(b.date));
  if (measures.length >= 2) {
    const first = measures[0];
    const last = measures[measures.length - 1];
    if (first.arm != null && last.arm != null) {
      const armDelta = Math.round((last.arm - first.arm) * 10) / 10;
      if (armDelta >= 0.5) {
        insights.push({
          id: "arm-growth",
          icon: "💪",
          message: `محيط الذراع ارتفع ${armDelta} سم`,
          action: "القياسات",
          actionUrl: "/body",
          priority: "low",
        });
      }
    }
  }

  return insights.slice(0, 5);
}
