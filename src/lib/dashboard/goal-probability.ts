/** Goal probability — mirrors LifeOS_1.html logic */

export type ProbabilityLabel =
  | "ahead"
  | "on_track"
  | "slightly_behind"
  | "needs_attention";

export interface GoalProbability {
  label: ProbabilityLabel;
  text: string;
  className: "teal" | "emerald" | "amber" | "coral";
  delta: number;
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86400000
  );
}

export function calcGoalProbability(goal: {
  progress?: number;
  target_date?: string | null;
  targetDate?: string | null;
  due?: string | null;
  created_at?: string;
  start?: string | null;
  status?: string;
}): GoalProbability | null {
  const targetDate = goal.target_date ?? goal.targetDate ?? goal.due;
  if (!targetDate || goal.status === "done") return null;

  const today = new Date().toISOString().slice(0, 10);
  const startDate = goal.created_at?.split("T")[0] ?? goal.start ?? today;
  const totalDays = Math.max(daysBetween(startDate, targetDate), 1);
  const daysFromStart = Math.max(daysBetween(startDate, today), 0);
  const timeProgress = (daysFromStart / totalDays) * 100;
  const progress = goal.progress ?? 0;
  const delta = progress - timeProgress;

  if (delta >= 5) {
    return { label: "ahead", text: "🚀 متقدم على الجدول", className: "teal", delta };
  }
  if (delta >= -10) {
    return { label: "on_track", text: "✅ على المسار", className: "emerald", delta };
  }
  if (delta >= -25) {
    return { label: "slightly_behind", text: "⚠️ متأخر قليلاً", className: "amber", delta };
  }
  return { label: "needs_attention", text: "🚨 يحتاج اهتمام", className: "coral", delta };
}
