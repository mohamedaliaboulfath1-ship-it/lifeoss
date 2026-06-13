import type { GoalProgressInput } from "@/domains/intelligence/types";
import type { GoalProbability } from "@/domains/intelligence/engines/forecast.engine";

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/** Goal progress & probability — consolidated engine */
export class GoalProgressEngine {
  calculateMetricProgress(goal: {
    target?: string;
    current?: string;
    startVal?: string;
    done?: boolean;
    progress?: number;
  }): number {
    if (!goal.target || goal.current === undefined) return goal.done ? 100 : goal.progress ?? 0;
    const s = parseFloat(goal.startVal ?? goal.current ?? "0");
    const c = parseFloat(goal.current);
    const t = parseFloat(goal.target);
    if (t === s) return goal.done ? 100 : 0;
    return Math.max(0, Math.min(100, Math.round(((c - s) / (t - s)) * 100)));
  }

  calculateProbability(goal: {
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

  private taskScore(
    goal: { progress?: number; tasks?: { done?: boolean }[] },
    linkedTaskDone: number,
    linkedTaskTotal: number
  ): number {
    const embedded = goal.tasks ?? [];
    const embeddedDone = embedded.filter((t) => t.done).length;
    const total = linkedTaskTotal + embedded.length;
    const done = linkedTaskDone + embeddedDone;
    return total ? Math.round((done / total) * 100) : goal.progress ?? 0;
  }

  calculateCompletion(input: {
    goal: GoalProgressInput["goal"];
    linkedHabits: GoalProgressInput["linkedHabits"];
    logs: Record<string, Record<string, boolean>>;
    linkedTaskDone?: number;
    linkedTaskTotal?: number;
    habitAdherenceFn: (habitId: string, logs: Record<string, Record<string, boolean>>, days: number[], window: number) => number;
  }) {
    const { goal, linkedHabits, logs } = input;
    const habitContrib = goal.habitContributionPct ?? 40;
    const taskContrib = goal.taskContributionPct ?? 40;
    const progressContrib = goal.progressContributionPct ?? 20;

    const habitScore =
      linkedHabits.length > 0
        ? Math.round(
            linkedHabits.reduce((s, h) => {
              const days = h.activeDays ?? [0, 1, 2, 3, 4, 5, 6];
              return s + input.habitAdherenceFn(h.id, logs, days, 14);
            }, 0) / linkedHabits.length
          )
        : 100;

    const tScore = this.taskScore(goal, input.linkedTaskDone ?? 0, input.linkedTaskTotal ?? 0);
    const pScore = goal.progress ?? 0;

    const completionScore = Math.round(
      (habitScore * habitContrib + tScore * taskContrib + pScore * progressContrib) / 100
    );

    const prob = this.calculateProbability(goal);
    const habitPenalty = habitScore < 50 ? Math.round((50 - habitScore) * 0.4) : 0;
    const successProbability = Math.max(5, Math.min(98, completionScore - habitPenalty));

    const atRisk =
      successProbability < 65 ||
      prob?.label === "needs_attention" ||
      prob?.label === "slightly_behind";

    let probabilityText = `احتمالية النجاح ${successProbability}%`;
    if (habitScore < 40 && linkedHabits.length > 0) {
      probabilityText = `انخفضت احتمالية النجاح إلى ${successProbability}% — العادات المرتبطة ضعيفة`;
    } else if (prob) {
      probabilityText = `${prob.text} · ${successProbability}%`;
    }

    return {
      goalId: goal.id,
      title: goal.title,
      level: goal.level,
      completionScore,
      successProbability,
      taskScore: tScore,
      habitScore,
      progressScore: pScore,
      linkedHabits: linkedHabits.length,
      atRisk,
      probabilityText,
    };
  }
}

export const goalProgressEngine = new GoalProgressEngine();
