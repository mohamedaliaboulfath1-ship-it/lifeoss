import { calcGoalProbability } from "@/lib/dashboard/goal-probability";
import { calcAdherence } from "@/lib/habits/intelligence";
import type { Goal, Habit } from "@/types/lifeos";
import type { GoalCompletion } from "@/types/para";

function taskScore(goal: Goal, linkedTaskDone: number, linkedTaskTotal: number): number {
  const embedded = goal.tasks ?? [];
  const embeddedDone = embedded.filter((t) => t.done).length;
  const total = linkedTaskTotal + embedded.length;
  const done = linkedTaskDone + embeddedDone;
  return total ? Math.round((done / total) * 100) : goal.progress ?? 0;
}

export function calcGoalCompletionScore(input: {
  goal: Goal;
  linkedHabits: Habit[];
  logs: Record<string, Record<string, boolean>>;
  linkedTaskDone?: number;
  linkedTaskTotal?: number;
}): GoalCompletion {
  const { goal, linkedHabits, logs } = input;
  const habitContrib = (goal as Goal & { habitContributionPct?: number }).habitContributionPct ?? 40;
  const taskContrib = (goal as Goal & { taskContributionPct?: number }).taskContributionPct ?? 40;
  const progressContrib = (goal as Goal & { progressContributionPct?: number }).progressContributionPct ?? 20;

  const habitScore =
    linkedHabits.length > 0
      ? Math.round(
          linkedHabits.reduce((s, h) => {
            const days = (h as Habit & { activeDays?: number[] }).activeDays ?? [0, 1, 2, 3, 4, 5, 6];
            return s + calcAdherence(h.id, logs, days, 14);
          }, 0) / linkedHabits.length
        )
      : 100;

  const tScore = taskScore(goal, input.linkedTaskDone ?? 0, input.linkedTaskTotal ?? 0);
  const pScore = goal.progress ?? 0;

  const completionScore = Math.round(
    (habitScore * habitContrib + tScore * taskContrib + pScore * progressContrib) / 100
  );

  const prob = calcGoalProbability(goal);
  const habitPenalty = habitScore < 50 ? Math.round((50 - habitScore) * 0.4) : 0;
  const baseProb = completionScore;
  const successProbability = Math.max(5, Math.min(98, baseProb - habitPenalty));

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
