import type {
  CareerCertification,
  CareerRoadmapStage,
  CareerSkillMatrixItem,
  PortfolioProject,
} from "@/types/lifeos";
import { enrichSkillScores } from "@/lib/career/skill-engine";

export interface CareerReadiness {
  score: number;
  targetScore: number;
  gap: number;
  forecastYears: number | null;
  breakdown: {
    skills: number;
    certifications: number;
    projects: number;
    learning: number;
    roadmap: number;
  };
}

export function calcCareerReadiness(input: {
  skills: CareerSkillMatrixItem[];
  certs: CareerCertification[];
  projects: PortfolioProject[];
  roadmap: CareerRoadmapStage[];
  learningHoursWeek?: number;
  learningTarget?: number;
  goalProgress?: number;
}): CareerReadiness {
  const enriched = enrichSkillScores(input.skills, {
    certs: input.certs,
    projects: input.projects,
  });

  const skillsScore =
    enriched.length > 0
      ? Math.round(
          enriched.reduce((s, x) => s + Math.min(100, (x.current / Math.max(x.target, 1)) * 100), 0) /
            enriched.length
        )
      : 0;

  const certsScore =
    input.certs.length > 0
      ? Math.round(
          input.certs.reduce((s, c) => s + (c.progressPct ?? (c.status === "done" || c.status === "passed" ? 100 : 30)), 0) /
            input.certs.length
        )
      : 0;

  const projectsScore =
    input.projects.length > 0
      ? Math.round(
          input.projects.reduce(
            (s, p) => s + (p.status === "done" ? 100 : p.status === "active" ? 50 : 20),
            0
          ) / input.projects.length
        )
      : 0;

  const learningTarget = input.learningTarget ?? 5;
  const learningScore = Math.min(
    100,
    Math.round(((input.learningHoursWeek ?? 0) / learningTarget) * 100)
  );

  const activeStage = input.roadmap.find((r) => r.status === "active") ?? input.roadmap[0];
  const roadmapScore = activeStage?.progressPct ?? (input.roadmap.length > 0 ? 20 : 0);

  const goalBonus = Math.round((input.goalProgress ?? 0) * 0.1);

  const score = Math.min(
    100,
    Math.round(
      skillsScore * 0.3 +
        certsScore * 0.25 +
        projectsScore * 0.2 +
        learningScore * 0.15 +
        roadmapScore * 0.1 +
        goalBonus
    )
  );

  const targetScore = 100;
  const gap = targetScore - score;

  const remainingStages = input.roadmap.filter((r) => r.status !== "done").length;
  const forecastYears =
    remainingStages > 0 && score > 0
      ? Math.round((remainingStages * (100 - score)) / 20) / 10
      : null;

  return {
    score,
    targetScore,
    gap,
    forecastYears,
    breakdown: {
      skills: skillsScore,
      certifications: certsScore,
      projects: projectsScore,
      learning: learningScore,
      roadmap: roadmapScore,
    },
  };
}
