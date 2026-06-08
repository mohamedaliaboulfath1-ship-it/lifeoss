import type { UserTimeSettings } from "@/types/time";

/** Mohamed's default schedule — Sun–Thu work, Sat partial, Fri off */
export const DEFAULT_TIME_SETTINGS: UserTimeSettings = {
  sleepHours: 8,
  commuteMinutes: 60,
  workDays: [0, 1, 2, 3, 4],
  workStart: "08:30",
  workEnd: "16:30",
  satWorkEnabled: true,
  satWorkStart: "11:00",
  satWorkEnd: "16:00",
  friOff: true,
  homeArrival: "17:00",
  timezone: "Africa/Cairo",
};

export const DOMAIN_COLORS: Record<string, string> = {
  domain_body: "#2dd4bf",
  domain_finance: "#fbbf24",
  domain_career: "#60a5fa",
  domain_learning: "#a78bfa",
  domain_relationships: "#f472b6",
  domain_spiritual: "#34d399",
  domain_self_dev: "#fb923c",
  domain_discipline: "#e879f9",
};

export const FOCUS_SESSION_MINUTES: Record<string, number> = {
  pomodoro_25: 25,
  pomodoro_50: 50,
  deep_90: 90,
  deep_120: 120,
  deep_work: 60,
  custom: 30,
};
