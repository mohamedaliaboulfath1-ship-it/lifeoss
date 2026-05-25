import type { Goal, Skill, YearPayload } from "@/types/lifeos";
import { getWeekDates, isThisWeek } from "@/lib/utils";

export function calcGoalPct(g: Goal) {
  if (!g.target || g.current === undefined) return 0;
  const s = parseFloat(g.startVal ?? g.current ?? "0");
  const c = parseFloat(g.current);
  const t = parseFloat(g.target);
  if (t === s) return 0;
  return Math.max(0, Math.min(100, Math.round(((c - s) / (t - s)) * 100)));
}

export function calcOverallHabitPct(
  year: YearPayload,
  weekOffset = 0
) {
  const logs = year.habitLogs ?? {};
  const week = getWeekDates(weekOffset);
  const habits = year.habits ?? [];
  if (!habits.length) return 0;
  let done = 0;
  let total = 0;
  habits.forEach((h) => {
    week.forEach((d) => {
      total++;
      if (logs[h.id]?.[d]) done++;
    });
  });
  return total ? Math.round((done / total) * 100) : 0;
}

export function calcCareerPct(year: YearPayload) {
  const skills = (year.skills ?? []) as Skill[];
  const done = skills.filter((s) => s.status === "done").length;
  return Math.min(100, Math.round((done / 6) * 100));
}

export function areaColor(area: string) {
  const map: Record<string, string> = {
    body: "var(--gold)",
    finance: "var(--emerald)",
    career: "var(--sky)",
    mind: "var(--purple)",
    spirit: "var(--gold2)",
    relation: "var(--rose)",
    self: "var(--teal2)",
  };
  return map[area] ?? "var(--text3)";
}

export function areaLabel(area: string) {
  const map: Record<string, string> = {
    body: "💪 الجسد",
    finance: "💰 المال",
    career: "📈 المهنة",
    mind: "🧠 العقل",
    spirit: "🕌 الروح",
    relation: "💗 العلاقات",
    self: "⭐ تطوير ذات",
  };
  return map[area] ?? area;
}

export interface Alert {
  icon: string;
  msg: string;
  action: string;
  bg: string;
  border: string;
}

export function buildAlerts(
  year: YearPayload,
  profile: { startWeight?: number | null }
) {
  const alerts: Alert[] = [];
  const wLogs = year.weightLogs ?? [];
  if (!wLogs.length) {
    alerts.push({
      icon: "⚖️",
      msg: "لم تسجّل وزنك هذا الأسبوع",
      action: "سجّل الآن",
      bg: "rgba(200,150,60,.07)",
      border: "rgba(200,150,60,.2)",
    });
  }
  const savings = (year.transactions ?? [])
    .filter((t) => t.type === "saving")
    .reduce((a, b) => a + b.amount, 0);
  if (savings < 500) {
    alerts.push({
      icon: "🚨",
      msg: "صندوق الطوارئ الأولوية #1 — ادخر 500 ريال/شهر",
      action: "ابدأ الآن",
      bg: "rgba(217,79,106,.07)",
      border: "rgba(217,79,106,.2)",
    });
  }
  const workoutLogs = (year.workoutLogs ?? []) as { date?: string }[];
  const thisWeekW = workoutLogs.filter((w) => isThisWeek(w.date)).length;
  if (thisWeekW < 3) {
    alerts.push({
      icon: "🏋️",
      msg: `${5 - thisWeekW} تمارين متبقية هذا الأسبوع`,
      action: "سجّل جلسة",
      bg: "rgba(58,143,212,.07)",
      border: "rgba(58,143,212,.2)",
    });
  }
  void profile;
  return alerts;
}

export function createDefaultYearPayload(): YearPayload {
  return {
    goals: [],
    habits: [],
    habitLogs: {},
    weightLogs: [],
    measureLogs: [],
    workoutLogs: [],
    books: [],
    transactions: [],
    skills: [],
    portfolio: [],
    reviews: [],
    pomSessions: [],
    milestones: [],
    timeslots: {},
    identity: { traits: [], rules: [] },
    energy: [],
  };
}
