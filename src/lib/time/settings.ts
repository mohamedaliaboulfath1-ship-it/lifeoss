import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserTimeSettings } from "@/types/time";
import { DEFAULT_TIME_SETTINGS } from "@/lib/time/defaults";

export function mapSettingsRow(row: Record<string, unknown> | null): UserTimeSettings {
  if (!row) return { ...DEFAULT_TIME_SETTINGS };
  return {
    sleepHours: Number(row.sleep_hours ?? 8),
    commuteMinutes: Number(row.commute_minutes ?? 60),
    workDays: (row.work_days as number[]) ?? [0, 1, 2, 3, 4],
    workStart: String(row.work_start ?? "08:30").slice(0, 5),
    workEnd: String(row.work_end ?? "16:30").slice(0, 5),
    satWorkEnabled: Boolean(row.sat_work_enabled ?? true),
    satWorkStart: String(row.sat_work_start ?? "11:00").slice(0, 5),
    satWorkEnd: String(row.sat_work_end ?? "16:00").slice(0, 5),
    friOff: Boolean(row.fri_off ?? true),
    homeArrival: String(row.home_arrival ?? "17:00").slice(0, 5),
    timezone: String(row.timezone ?? "Africa/Cairo"),
  };
}

export async function loadTimeSettings(db: SupabaseClient, userId: string): Promise<UserTimeSettings> {
  const { data } = await db.from("user_time_settings").select("*").eq("user_id", userId).maybeSingle();
  return mapSettingsRow(data);
}

export async function upsertTimeSettings(
  db: SupabaseClient,
  userId: string,
  settings: Partial<UserTimeSettings>
): Promise<UserTimeSettings> {
  const current = await loadTimeSettings(db, userId);
  const merged = { ...current, ...settings };
  await db.from("user_time_settings").upsert({
    user_id: userId,
    sleep_hours: merged.sleepHours,
    commute_minutes: merged.commuteMinutes,
    work_days: merged.workDays,
    work_start: merged.workStart,
    work_end: merged.workEnd,
    sat_work_enabled: merged.satWorkEnabled,
    sat_work_start: merged.satWorkStart,
    sat_work_end: merged.satWorkEnd,
    fri_off: merged.friOff,
    home_arrival: merged.homeArrival,
    timezone: merged.timezone,
    updated_at: new Date().toISOString(),
  });
  return merged;
}

function parseTimeOnDate(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

/** Returns true if slot overlaps work hours and allowDuringWork is false */
export function isWorkBlocked(
  settings: UserTimeSettings,
  startAt: Date,
  endAt: Date,
  allowDuringWork: boolean
): boolean {
  if (allowDuringWork) return false;
  const day = startAt.getDay();
  if (settings.friOff && day === 5) return false;

  let workStart: string | null = null;
  let workEnd: string | null = null;

  if (settings.workDays.includes(day)) {
    workStart = settings.workStart;
    workEnd = settings.workEnd;
  } else if (day === 6 && settings.satWorkEnabled) {
    workStart = settings.satWorkStart;
    workEnd = settings.satWorkEnd;
  }

  if (!workStart || !workEnd) return false;

  const dateStr = startAt.toISOString().slice(0, 10);
  const ws = parseTimeOnDate(dateStr, workStart);
  const we = parseTimeOnDate(dateStr, workEnd);
  return startAt < we && endAt > ws;
}

export function getWorkWindow(settings: UserTimeSettings, dateStr: string): { start: Date; end: Date } | null {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  if (settings.friOff && day === 5) return null;

  let workStart: string | null = null;
  let workEnd: string | null = null;
  if (settings.workDays.includes(day)) {
    workStart = settings.workStart;
    workEnd = settings.workEnd;
  } else if (day === 6 && settings.satWorkEnabled) {
    workStart = settings.satWorkStart;
    workEnd = settings.satWorkEnd;
  }
  if (!workStart || !workEnd) return null;
  return {
    start: parseTimeOnDate(dateStr, workStart),
    end: parseTimeOnDate(dateStr, workEnd),
  };
}
