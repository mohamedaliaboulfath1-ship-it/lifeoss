import type { HabitScoreInput } from "@/domains/intelligence/types";

const DAY_MS = 86400000;

/** Habit scoring — streaks, adherence, life score contribution */
export class HabitScoreEngine {
  currentStreak(habitId: string, logs: Record<string, Record<string, boolean>>): number {
    const dates = Object.keys(logs[habitId] ?? {})
      .filter((d) => logs[habitId][d])
      .sort()
      .reverse();
    if (!dates.length) return 0;

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().slice(0, 10);
      if (logs[habitId]?.[key]) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (i === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      } else {
        break;
      }
    }
    return streak;
  }

  longestStreak(habitId: string, logs: Record<string, Record<string, boolean>>): number {
    const dates = Object.keys(logs[habitId] ?? {})
      .filter((d) => logs[habitId][d])
      .sort();
    if (!dates.length) return 0;

    let best = 1;
    let current = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]).getTime();
      const cur = new Date(dates[i]).getTime();
      if (cur - prev <= DAY_MS) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 1;
      }
    }
    return Math.max(best, this.currentStreak(habitId, logs));
  }

  adherence(
    habitId: string,
    logs: Record<string, Record<string, boolean>>,
    activeDays: number[],
    days = 30
  ): number {
    let expected = 0;
    let done = 0;
    const cursor = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() - i);
      const dow = d.getDay();
      if (!activeDays.includes(dow)) continue;
      expected++;
      const key = d.toISOString().slice(0, 10);
      if (logs[habitId]?.[key]) done++;
    }
    return expected ? Math.round((done / expected) * 100) : 0;
  }

  lifeScoreContribution(
    adherencePct: number,
    impact: "low" | "medium" | "high" = "medium",
    weight = 1
  ): number {
    const impactMul = impact === "high" ? 1.4 : impact === "medium" ? 1.0 : 0.6;
    return Math.round(Math.min(100, adherencePct * 0.01 * weight * impactMul * 10));
  }

  score(input: HabitScoreInput) {
    const adherence = this.adherence(
      input.habitId,
      input.logs,
      input.activeDays,
      input.windowDays ?? 30
    );
    return {
      adherencePct: adherence,
      currentStreak: this.currentStreak(input.habitId, input.logs),
      longestStreak: this.longestStreak(input.habitId, input.logs),
      lifeScoreContribution: this.lifeScoreContribution(
        adherence,
        input.impact,
        input.weight
      ),
    };
  }
}

export const habitScoreEngine = new HabitScoreEngine();
