/**
 * @deprecated Import from @/domains/intelligence — backward-compatible shim
 */
export {
  type ProbabilityLabel,
  type GoalProbability,
} from "@/domains/intelligence/engines/forecast.engine";

import { goalProgressEngine } from "@/domains/intelligence/engines/goal-progress.engine";

export function calcGoalProbability(goal: {
  progress?: number;
  target_date?: string | null;
  targetDate?: string | null;
  due?: string | null;
  created_at?: string;
  start?: string | null;
  status?: string;
}) {
  return goalProgressEngine.calculateProbability(goal);
}
