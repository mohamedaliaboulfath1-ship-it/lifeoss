import type { UserTimeSettings, DailyCapacity, WeeklyCapacity, DomainTimeAllocation } from "@/types/time";
import { getWorkWindow } from "@/lib/time/settings";
import { SYSTEM_DOMAINS } from "@/lib/domains";

type BlockLike = { start_at: string; end_at: string; status: string; domain_id?: string | null; actual_minutes?: number | null };

function blockMinutes(b: BlockLike, useActual = false): number {
  if (useActual && b.actual_minutes) return b.actual_minutes;
  const start = new Date(b.start_at).getTime();
  const end = new Date(b.end_at).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

export function calcDailyCapacity(
  settings: UserTimeSettings,
  dateStr: string,
  blocks: BlockLike[],
  extraLoggedMinutes = 0
): DailyCapacity {
  const wakingHours = 24 - settings.sleepHours;
  const work = getWorkWindow(settings, dateStr);
  const workHours = work
    ? (work.end.getTime() - work.start.getTime()) / 3600000
    : 0;
  const commuteHours = work ? settings.commuteMinutes / 60 : 0;

  const dayBlocks = blocks.filter((b) => b.start_at.slice(0, 10) === dateStr);
  const plannedMinutes = dayBlocks
    .filter((b) => b.status !== "missed")
    .reduce((s, b) => s + blockMinutes(b), 0);
  const loggedMinutes =
    dayBlocks
      .filter((b) => b.status === "done")
      .reduce((s, b) => s + (b.actual_minutes ?? blockMinutes(b, true)), 0) + extraLoggedMinutes;

  const fixedHours = workHours + commuteHours;
  const availableHours = Math.max(0, wakingHours - fixedHours);
  const plannedHours = plannedMinutes / 60;
  const loggedHours = loggedMinutes / 60;

  return {
    date: dateStr,
    totalWakingHours: wakingHours,
    workHours,
    commuteHours,
    fixedHours,
    availableHours,
    plannedHours,
    loggedHours,
    remainingHours: Math.max(0, availableHours - plannedHours),
  };
}

export function calcWeeklyCapacity(
  settings: UserTimeSettings,
  weekDates: string[],
  blocks: BlockLike[],
  focusMinutesByDomain: Record<string, number>
): WeeklyCapacity {
  const days = weekDates.map((d) => calcDailyCapacity(settings, d, blocks));
  const totalAvailableHours = days.reduce((s, d) => s + d.availableHours, 0);
  const totalPlannedHours = days.reduce((s, d) => s + d.plannedHours, 0);
  const totalLoggedHours = days.reduce((s, d) => s + d.loggedHours, 0);

  const domainMap: Record<string, { planned: number; actual: number }> = {};
  for (const b of blocks) {
    const dom = b.domain_id ?? "domain_self_dev";
    if (!domainMap[dom]) domainMap[dom] = { planned: 0, actual: 0 };
    if (b.status !== "missed") domainMap[dom].planned += blockMinutes(b);
    if (b.status === "done") domainMap[dom].actual += b.actual_minutes ?? blockMinutes(b, true);
  }
  for (const [dom, mins] of Object.entries(focusMinutesByDomain)) {
    if (!domainMap[dom]) domainMap[dom] = { planned: 0, actual: 0 };
    domainMap[dom].actual += mins;
  }

  const totalActual = Object.values(domainMap).reduce((s, x) => s + x.actual, 0) || 1;
  const totalPlanned = Object.values(domainMap).reduce((s, x) => s + x.planned, 0) || 1;

  const byDomain: DomainTimeAllocation[] = SYSTEM_DOMAINS.map((d) => {
    const v = domainMap[d.id] ?? { planned: 0, actual: 0 };
    return {
      domainId: d.id,
      slug: d.slug,
      nameAr: d.nameAr,
      color: d.color ?? "#94a3b8",
      plannedMinutes: v.planned,
      actualMinutes: v.actual,
      plannedPct: Math.round((v.planned / totalPlanned) * 100),
      actualPct: Math.round((v.actual / totalActual) * 100),
    };
  }).filter((x) => x.plannedMinutes > 0 || x.actualMinutes > 0);

  return {
    weekStart: weekDates[0],
    totalAvailableHours: Math.round(totalAvailableHours * 10) / 10,
    totalPlannedHours: Math.round(totalPlannedHours * 10) / 10,
    totalLoggedHours: Math.round(totalLoggedHours * 10) / 10,
    byDomain,
  };
}
