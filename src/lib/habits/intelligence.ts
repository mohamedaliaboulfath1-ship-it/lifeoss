import { calcStreak } from "@/lib/calculations";
import { getDomainById, resolveDomainId } from "@/lib/domains";
import {
  activeDaysFromSchedule,
  formatScheduleLabel,
  isHabitDueOnDate,
  type FrequencyType,
  type FrequencyValue,
} from "@/lib/habits/schedule";
import { today } from "@/lib/utils";
import type { Goal, Habit } from "@/types/lifeos";
import type { EnrichedHabit, HabitImpact, HabitPriority } from "@/types/para";

const DAY_MS = 86400000;

export function calcBestStreak(
  habitId: string,
  logs: Record<string, Record<string, boolean>>
): number {
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
  return Math.max(best, calcStreak(habitId, logs));
}

export function calcAdherence(
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

export function isActiveToday(activeDays: number[]): boolean {
  return activeDays.includes(new Date().getDay());
}

export function isDueToday(
  habit: HabitScheduleInput,
  logs: Record<string, Record<string, boolean>> = {}
): boolean {
  return isHabitDueOnDate(habit, today(), logs);
}

type HabitScheduleInput = {
  id?: string;
  frequencyType?: FrequencyType | string | null;
  frequencyValue?: FrequencyValue | Record<string, unknown> | null;
  activeDays?: number[];
  freq?: string;
};

export function calcScheduleAdherence(
  habit: HabitScheduleInput & { id: string },
  logs: Record<string, Record<string, boolean>>,
  days = 30
): number {
  let expected = 0;
  let done = 0;
  const cursor = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (!isHabitDueOnDate(habit, key, logs)) continue;
    expected++;
    if (logs[habit.id]?.[key]) done++;
  }
  return expected ? Math.round((done / expected) * 100) : 0;
}

export function calcLifeScoreContribution(
  adherencePct: number,
  impact: HabitImpact,
  weight: number
): number {
  const impactMul = impact === "high" ? 1.4 : impact === "medium" ? 1.0 : 0.6;
  return Math.round(Math.min(100, adherencePct * 0.01 * weight * impactMul * 10));
}

export function enrichHabit(
  habit: Habit & {
    domainId?: string;
    projectId?: string;
    why?: string;
    stopImpact?: string;
    priority?: HabitPriority;
    impact?: HabitImpact;
    activeDays?: number[];
    frequencyType?: FrequencyType | string;
    frequencyValue?: FrequencyValue | Record<string, unknown>;
    lifeScoreWeight?: number;
    active?: boolean;
    bestStreak?: number;
  },
  logs: Record<string, Record<string, boolean>>,
  goalsById: Map<string, Goal>
): EnrichedHabit {
  const activeDays = activeDaysFromSchedule(habit);
  const scheduleLabel = formatScheduleLabel(habit);
  const dueToday = isHabitDueOnDate(habit, today(), logs);
  const domainId = habit.domainId ?? resolveDomainId(habit.cat);
  const domain = getDomainById(domainId);
  const goalId = habit.goalLink;
  const goal = goalId ? goalsById.get(goalId) : undefined;
  const projectId = habit.projectId ?? (goal?.level === "project" ? goal.id : goal?.parentId);
  const project = projectId ? goalsById.get(projectId) : undefined;
  const parentGoal = goal?.parentId ? goalsById.get(goal.parentId) : goal?.level === "goal" ? goal : undefined;

  const currentStreak = calcStreak(habit.id, logs);
  const bestStreak = Math.max(habit.bestStreak ?? 0, calcBestStreak(habit.id, logs));
  const adherencePct = calcScheduleAdherence(habit, logs);
  const impact = habit.impact ?? "medium";
  const lifeScoreWeight = habit.lifeScoreWeight ?? 1;

  return {
    id: habit.id,
    name: habit.name,
    cat: habit.cat,
    freq: habit.freq,
    time: habit.time,
    dur: habit.dur,
    note: habit.note,
    domainId,
    domainName: domain?.nameAr,
    domainIcon: domain?.icon,
    goalId: parentGoal?.id ?? goalId,
    goalTitle: parentGoal?.title ?? goal?.title,
    projectId: project?.id,
    projectTitle: project?.title,
    why: habit.why,
    stopImpact: habit.stopImpact,
    priority: habit.priority ?? "normal",
    impact,
    activeDays,
    frequencyType: (habit.frequencyType as FrequencyType) ?? undefined,
    frequencyValue: habit.frequencyValue as Record<string, unknown> | undefined,
    scheduleLabel,
    dueToday,
    lifeScoreWeight,
    currentStreak,
    bestStreak,
    adherencePct,
    lifeScoreContribution: calcLifeScoreContribution(adherencePct, impact, lifeScoreWeight),
    doneToday: dueToday ? Boolean(logs[habit.id]?.[today()]) : false,
    active: habit.active !== false,
  };
}
