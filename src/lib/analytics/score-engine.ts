import { runAnalyticsEngine, type AnalyticsResult } from "@/lib/analytics/engine";
import { calcOverallHabitPct } from "@/lib/calculations";
import type { YearPayload } from "@/types/lifeos";

export interface DomainScores {
  life: number;
  health: number;
  finance: number;
  learning: number;
  career: number;
  discipline: number;
  habitConsistency: number;
  goalProbability: number;
}

export interface FullAnalyticsPayload extends AnalyticsResult {
  domainScores: DomainScores;
  computedAt: string;
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function computeDomainScores(yearData: YearPayload, base: AnalyticsResult): DomainScores {
  const habitConsistency = clamp(calcOverallHabitPct(yearData));
  const goalProbability = base.goalForecasts.length
    ? clamp(
        base.goalForecasts.reduce((s, g) => s + (100 - (g.atRisk ? 30 : 0)), 0) /
          base.goalForecasts.length
      )
    : 50;

  const careerCerts = (yearData.careerCertifications ?? []).filter(
    (c) => c.status === "active" || c.status === "done"
  ).length;
  const careerCourses = (yearData.careerCourses ?? []).reduce(
    (s, c) => s + (c.progress ?? 0),
    0
  );
  const careerScore = clamp(careerCerts * 12 + careerCourses / 5);

  const healthScore = base.lifeScoreBreakdown.find((x) => x.label === "الصحة")?.score ?? 50;

  return {
    life: base.lifeScore,
    health: healthScore,
    finance: base.financeScore,
    learning: base.learningScore,
    career: careerScore,
    discipline: habitConsistency,
    habitConsistency,
    goalProbability,
  };
}

export function computeFullAnalytics(yearData: YearPayload): FullAnalyticsPayload {
  const base = runAnalyticsEngine(yearData);
  return {
    ...base,
    domainScores: computeDomainScores(yearData, base),
    computedAt: new Date().toISOString(),
  };
}
