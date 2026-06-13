/**
 * @deprecated Import from @/domains/goals — backward-compatible shim
 */
import { goalService } from "@/domains/goals/services/goal.service";
import type { Goal, Habit } from "@/types/lifeos";
import type { GoalCompletion } from "@/types/para";

export function calcGoalCompletionScore(input: {
  goal: Goal;
  linkedHabits: Habit[];
  logs: Record<string, Record<string, boolean>>;
  linkedTaskDone?: number;
  linkedTaskTotal?: number;
}): GoalCompletion {
  return goalService.calculateCompletionScore(input);
}
