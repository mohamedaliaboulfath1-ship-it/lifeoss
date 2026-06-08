import type { YearPayload } from "@/types/lifeos";
import { calcCareerReadiness } from "@/lib/career/readiness";
import { enrichSkillScores } from "@/lib/career/skill-engine";
import { getWeekDates } from "@/lib/utils";

/** Single source of truth for career score — used by score-engine, snapshot, analytics */
export function computeUnifiedCareerScore(yearData: YearPayload): number {
  const skills = enrichSkillScores(yearData.careerSkillMatrix ?? [], {
    certs: yearData.careerCertifications ?? [],
    projects: yearData.careerPortfolio ?? [],
  });

  const weekStart = getWeekDates(0)[0];
  const studyMins = (yearData.studySessions ?? [])
    .filter((r) => r.date >= weekStart)
    .reduce((s, r) => s + (r.durationMin ?? 0), 0);
  const courseHours = (yearData.careerCourses ?? [])
    .filter((c) => c.status === "active")
    .reduce((s, c) => s + (c.hours * (c.progress / 100)), 0);
  const learningHoursWeek = Math.round((studyMins / 60 + courseHours) * 10) / 10;

  const careerGoals = (yearData.goals ?? []).filter(
    (g) => g.area === "career" || (g as { category?: string }).category === "career"
  );
  const goalProgress =
    careerGoals.length > 0
      ? Math.round(careerGoals.reduce((s, g) => s + (g.progress ?? 0), 0) / careerGoals.length)
      : 0;

  const careerHabits = (yearData.habits ?? []).filter(
    (h) => h.cat === "career" || h.goalLink
  );
  const habitBonus =
    careerHabits.length > 0
      ? Math.min(15, Math.round(careerHabits.length * 3))
      : 0;

  const readiness = calcCareerReadiness({
    skills,
    certs: yearData.careerCertifications ?? [],
    projects: yearData.careerPortfolio ?? [],
    roadmap: yearData.careerRoadmap ?? [],
    learningHoursWeek,
    goalProgress,
  });

  return Math.min(100, readiness.score + habitBonus);
}
