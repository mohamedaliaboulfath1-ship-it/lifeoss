import type { TimeBlock, UserTimeSettings } from "@/types/time";
import { getWorkWindow } from "@/lib/time/settings";

/** Full 24-hour timeline: 00:00 → 23:00 */
export const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
export const HOUR_HEIGHT_PX = 40;
export const CALENDAR_HEIGHT_PX = HOURS_24.length * HOUR_HEIGHT_PX;

export function hourLabel(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

export function blockPosition(block: TimeBlock): { top: number; height: number } {
  const start = new Date(block.startAt);
  const end = new Date(block.endAt);
  const top = (start.getHours() * 60 + start.getMinutes()) / 60;
  const height = Math.max(0.35, (end.getTime() - start.getTime()) / 3600000);
  return {
    top: top * HOUR_HEIGHT_PX,
    height: height * HOUR_HEIGHT_PX,
  };
}

export function workOverlayStyle(
  settings: UserTimeSettings,
  dateStr: string
): { top: number; height: number } | null {
  const work = getWorkWindow(settings, dateStr);
  if (!work) return null;
  const startH = work.start.getHours() + work.start.getMinutes() / 60;
  const endH = work.end.getHours() + work.end.getMinutes() / 60;
  return {
    top: startH * HOUR_HEIGHT_PX,
    height: (endH - startH) * HOUR_HEIGHT_PX,
  };
}

export function timeMetrics(
  settings: UserTimeSettings,
  dateStr: string,
  blocks: TimeBlock[]
) {
  const dayBlocks = blocks.filter((b) => b.startAt.slice(0, 10) === dateStr);
  const work = getWorkWindow(settings, dateStr);
  const workHours = work
    ? (work.end.getTime() - work.start.getTime()) / 3600000
    : 0;

  let plannedMinutes = 0;
  let deepWorkMinutes = 0;
  let doneMinutes = 0;

  for (const b of dayBlocks) {
    const mins = Math.round(
      (new Date(b.endAt).getTime() - new Date(b.startAt).getTime()) / 60000
    );
    if (b.status !== "missed") plannedMinutes += mins;
    if (b.status === "done") doneMinutes += b.actualMinutes ?? mins;
    if (b.blockType === "deep_work") deepWorkMinutes += mins;
  }

  const wakingHours = 24 - settings.sleepHours;
  const availableHours = Math.max(0, wakingHours - workHours - settings.commuteMinutes / 60);
  const plannedHours = plannedMinutes / 60;
  const freeHours = Math.max(0, availableHours - plannedHours);
  const lostHours = Math.max(0, workHours - doneMinutes / 60);

  return {
    availableHours: Math.round(availableHours * 10) / 10,
    plannedHours: Math.round(plannedHours * 10) / 10,
    deepWorkHours: Math.round((deepWorkMinutes / 60) * 10) / 10,
    freeHours: Math.round(freeHours * 10) / 10,
    lostHours: Math.round(lostHours * 10) / 10,
    utilizationPct: availableHours > 0
      ? Math.round((plannedHours / availableHours) * 100)
      : 0,
  };
}

export function nextActivity(blocks: TimeBlock[], now = new Date()) {
  const upcoming = blocks
    .filter((b) => new Date(b.startAt) > now && b.status !== "done" && b.status !== "missed")
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return upcoming[0] ?? null;
}

export function currentBlock(blocks: TimeBlock[], now = new Date()) {
  return (
    blocks.find((b) => {
      const s = new Date(b.startAt);
      const e = new Date(b.endAt);
      return now >= s && now <= e && b.status !== "done";
    }) ?? null
  );
}
