import type { UserTimeSettings, SuggestedSlot } from "@/types/time";
import { isWorkBlocked, getWorkWindow } from "@/lib/time/settings";

const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

type ExistingBlock = { start_at: string; end_at: string };

function parseTime(dateStr: string, hour: number, minute: number): Date {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function freeSlotsOnDay(
  settings: UserTimeSettings,
  dateStr: string,
  existing: ExistingBlock[],
  durationMin: number
): { start: Date; end: Date }[] {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  if (settings.friOff && day === 5) return [];

  const slots: { start: Date; end: Date }[] = [];
  const work = getWorkWindow(settings, dateStr);

  const windows: { startH: number; startM: number; endH: number; endM: number }[] = [];

  if (work) {
    const [aH, aM] = settings.homeArrival.split(":").map(Number);
    windows.push({ startH: aH, startM: aM, endH: 23, endM: 0 });
    if (day !== 5 && day !== 6) {
      windows.push({ startH: 6, startM: 0, endH: parseInt(settings.workStart.split(":")[0]), endM: parseInt(settings.workStart.split(":")[1]) });
    }
  } else {
    windows.push({ startH: 8, startM: 0, endH: 22, endM: 30 });
  }

  for (const w of windows) {
    let cursor = parseTime(dateStr, w.startH, w.startM);
    const windowEnd = parseTime(dateStr, w.endH, w.endM === 0 ? 0 : w.endM);
    if (w.endH === 23) windowEnd.setHours(23, 0, 0, 0);

    while (cursor.getTime() + durationMin * 60000 <= windowEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + durationMin * 60000);
      const blockedByWork = isWorkBlocked(settings, cursor, slotEnd, false);
      const blockedByExisting = existing.some((b) =>
        overlaps(cursor, slotEnd, new Date(b.start_at), new Date(b.end_at))
      );
      if (!blockedByWork && !blockedByExisting) {
        slots.push({ start: new Date(cursor), end: slotEnd });
      }
      cursor = new Date(cursor.getTime() + 30 * 60000);
    }
  }
  return slots;
}

export function suggestSlots(
  settings: UserTimeSettings,
  existing: ExistingBlock[],
  durationMin: number,
  fromDate = new Date(),
  maxSuggestions = 5
): SuggestedSlot[] {
  const suggestions: SuggestedSlot[] = [];
  const cursor = new Date(fromDate);
  cursor.setMinutes(0, 0, 0);

  for (let dayOffset = 0; dayOffset < 14 && suggestions.length < maxSuggestions; dayOffset++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() + dayOffset);
    const dateStr = d.toISOString().slice(0, 10);
    const slots = freeSlotsOnDay(settings, dateStr, existing, durationMin);
    for (const slot of slots) {
      if (slot.start < fromDate) continue;
      const dayName = DAY_NAMES[slot.start.getDay()];
      const timeLabel = slot.start.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
      suggestions.push({
        startAt: slot.start.toISOString(),
        endAt: slot.end.toISOString(),
        dayLabel: `${dayName} ${timeLabel}`,
        reason: dayOffset === 0 ? "أقرب وقت متاح اليوم" : `متاح ${dayName}`,
      });
      if (suggestions.length >= maxSuggestions) break;
    }
  }
  return suggestions;
}

export function rescheduleBlock(
  settings: UserTimeSettings,
  existing: ExistingBlock[],
  durationMin: number,
  fromDate = new Date()
): SuggestedSlot | null {
  return suggestSlots(settings, existing, durationMin, fromDate, 1)[0] ?? null;
}
