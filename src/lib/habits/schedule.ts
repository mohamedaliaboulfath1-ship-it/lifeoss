import { today } from "@/lib/utils";

export type FrequencyType = "daily" | "weekly" | "monthly" | "interval" | "custom";

export interface FrequencyValue {
  days?: string[];
  weekdays?: number[];
  every?: number;
  dayOfMonth?: number | "last";
}

export interface HabitScheduleInput {
  frequencyType?: FrequencyType | string | null;
  frequencyValue?: FrequencyValue | Record<string, unknown> | null;
  activeDays?: number[];
  freq?: string;
}

const DAY_NAMES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

const DOW_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function parseFrequencyValue(raw: unknown): FrequencyValue {
  if (!raw || typeof raw !== "object") return {};
  const v = raw as FrequencyValue;
  return {
    days: v.days,
    weekdays: v.weekdays,
    every: v.every,
    dayOfMonth: v.dayOfMonth,
  };
}

export function inferFrequencyType(habit: HabitScheduleInput): FrequencyType {
  if (habit.frequencyType) return habit.frequencyType as FrequencyType;
  const days = habit.activeDays ?? [0, 1, 2, 3, 4, 5, 6];
  if (days.length === 7) return "daily";
  return "weekly";
}

export function resolveWeekdays(habit: HabitScheduleInput): number[] {
  const fv = parseFrequencyValue(habit.frequencyValue);
  if (fv.weekdays?.length) return [...new Set(fv.weekdays)].sort();
  if (fv.days?.length) {
    return [...new Set(fv.days.map((d) => DAY_NAMES[d.toLowerCase()] ?? -1).filter((n) => n >= 0))].sort();
  }
  const active = habit.activeDays;
  if (active?.length) return active;
  return [0, 1, 2, 3, 4, 5, 6];
}

function isLastDayOfMonth(dateStr: string): boolean {
  const d = new Date(`${dateStr}T12:00:00`);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return d.getDate() === last;
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000
  );
}

function lastDoneDate(habitId: string, logs: Record<string, Record<string, boolean>>): string | null {
  const dates = Object.keys(logs[habitId] ?? {})
    .filter((d) => logs[habitId][d])
    .sort();
  return dates[dates.length - 1] ?? null;
}

export function isHabitDueOnDate(
  habit: HabitScheduleInput & { id?: string },
  dateStr: string,
  logs: Record<string, Record<string, boolean>> = {}
): boolean {
  const type = inferFrequencyType(habit);
  const fv = parseFrequencyValue(habit.frequencyValue);
  const dow = new Date(`${dateStr}T12:00:00`).getDay();

  switch (type) {
    case "daily":
      return true;
    case "weekly":
    case "custom":
      return resolveWeekdays(habit).includes(dow);
    case "monthly": {
      if (fv.dayOfMonth === "last" || fv.dayOfMonth === -1) return isLastDayOfMonth(dateStr);
      const dom = fv.dayOfMonth ?? 1;
      return new Date(`${dateStr}T12:00:00`).getDate() === dom;
    }
    case "interval": {
      const every = fv.every ?? 7;
      if (!habit.id) return true;
      const last = lastDoneDate(habit.id, logs);
      if (!last) return true;
      return daysBetween(last, dateStr) >= every;
    }
    default:
      return resolveWeekdays(habit).includes(dow);
  }
}

export function isHabitDoneOnDate(
  habitId: string,
  dateStr: string,
  logs: Record<string, Record<string, boolean>>
): boolean {
  return Boolean(logs[habitId]?.[dateStr]);
}

export function getTodaysHabitIds(
  habits: (HabitScheduleInput & { id: string; active?: boolean })[],
  logs: Record<string, Record<string, boolean>>,
  dateStr = today()
): string[] {
  return habits
    .filter((h) => h.active !== false && isHabitDueOnDate(h, dateStr, logs))
    .map((h) => h.id);
}

export interface MissedHabitEntry {
  habitId: string;
  name: string;
  missedDate: string;
  daysAgo: number;
  scheduleLabel: string;
}

export function getMissedHabits(
  habits: (HabitScheduleInput & { id: string; name: string; active?: boolean })[],
  logs: Record<string, Record<string, boolean>>,
  lookbackDays = 14,
  untilDate = today()
): MissedHabitEntry[] {
  const missed: MissedHabitEntry[] = [];
  const until = new Date(`${untilDate}T12:00:00`);

  for (const h of habits) {
    if (h.active === false) continue;
    for (let i = 1; i <= lookbackDays; i++) {
      const d = new Date(until);
      d.setDate(until.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      if (!isHabitDueOnDate(h, dateStr, logs)) continue;
      if (isHabitDoneOnDate(h.id, dateStr, logs)) continue;
      missed.push({
        habitId: h.id,
        name: h.name,
        missedDate: dateStr,
        daysAgo: i,
        scheduleLabel: formatScheduleLabel(h),
      });
      break;
    }
  }

  return missed.sort((a, b) => a.daysAgo - b.daysAgo);
}

export function formatScheduleLabel(habit: HabitScheduleInput): string {
  const type = inferFrequencyType(habit);
  const fv = parseFrequencyValue(habit.frequencyValue);

  if (type === "daily") return "يومي";
  if (type === "interval") return `كل ${fv.every ?? 7} أيام`;
  if (type === "monthly") {
    if (fv.dayOfMonth === "last" || fv.dayOfMonth === -1) return "آخر يوم في الشهر";
    return `يوم ${fv.dayOfMonth ?? 1} من الشهر`;
  }
  const wds = resolveWeekdays(habit);
  if (wds.length === 7) return "يومي";
  return wds.map((d) => DOW_AR[d]).join(" · ");
}

export function activeDaysFromSchedule(habit: HabitScheduleInput): number[] {
  const type = inferFrequencyType(habit);
  if (type === "daily") return [0, 1, 2, 3, 4, 5, 6];
  if (type === "weekly" || type === "custom") return resolveWeekdays(habit);
  if (type === "interval" || type === "monthly") return [0, 1, 2, 3, 4, 5, 6];
  return habit.activeDays ?? [0, 1, 2, 3, 4, 5, 6];
}

export const SCHEDULE_PRESETS = [
  { id: "daily", label: "يومي", frequencyType: "daily" as const, frequencyValue: {} },
  {
    id: "gym",
    label: "الجيم (أحد–إثن–أرب–خم–سبت)",
    frequencyType: "weekly" as const,
    frequencyValue: { weekdays: [0, 1, 3, 4, 6] },
  },
  {
    id: "weight_weekly",
    label: "تسجيل الوزن — الجمعة",
    frequencyType: "weekly" as const,
    frequencyValue: { weekdays: [5] },
  },
  {
    id: "body_monthly",
    label: "قياس الجسم — شهري",
    frequencyType: "monthly" as const,
    frequencyValue: { dayOfMonth: 1 },
  },
  {
    id: "finance_month_end",
    label: "مراجعة مالية — آخر الشهر",
    frequencyType: "monthly" as const,
    frequencyValue: { dayOfMonth: "last" },
  },
  {
    id: "every_7",
    label: "كل 7 أيام",
    frequencyType: "interval" as const,
    frequencyValue: { every: 7 },
  },
];
