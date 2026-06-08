import type { GoalTimeForecast } from "@/types/time";

export function calcGoalTimeForecast(input: {
  id: string;
  title: string;
  requiredHours: number;
  loggedHours: number;
  targetDate?: string;
  weeklyPaceHours?: number;
}): GoalTimeForecast {
  const required = input.requiredHours || 0;
  const logged = input.loggedHours || 0;
  const remaining = Math.max(0, required - logged);
  const pace = input.weeklyPaceHours ?? 8;

  let expectedWeeks: number | null = null;
  let expectedDate: string | null = null;
  if (remaining > 0 && pace > 0) {
    expectedWeeks = Math.ceil(remaining / pace);
    const d = new Date();
    d.setDate(d.getDate() + expectedWeeks * 7);
    expectedDate = d.toISOString().slice(0, 10);
  }

  let riskLevel: GoalTimeForecast["riskLevel"] = "low";
  if (input.targetDate && expectedDate && expectedDate > input.targetDate) {
    riskLevel = "high";
  } else if (remaining > pace * 8) {
    riskLevel = "medium";
  }

  return {
    goalId: input.id,
    title: input.title,
    requiredHours: required,
    loggedHours: logged,
    remainingHours: remaining,
    weeklyPaceHours: pace,
    expectedWeeks,
    expectedDate,
    riskLevel,
  };
}
