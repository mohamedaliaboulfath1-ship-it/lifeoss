import type { CareerCertification, CareerSkillMatrixItem, PortfolioProject } from "@/types/lifeos";

/** System default cert → skill boost map (case-insensitive match on cert name) */
export const DEFAULT_CERT_BOOSTS: Record<string, Record<string, number>> = {
  FMVA: { "Financial Modeling": 15, Excel: 10, Valuation: 12, "FP&A": 8 },
  "Power BI": { "Data Analysis": 12, Dashboarding: 15, "Business Intelligence": 10 },
  CFA: { Valuation: 10, "Financial Modeling": 8, "FP&A": 6 },
  CMA: { "FP&A": 12, "Financial Modeling": 8, Leadership: 5 },
  SQL: { "Data Analysis": 15, "Business Intelligence": 8 },
  Python: { "Data Analysis": 12, "Financial Modeling": 6 },
};

export function hybridScore(
  manual: number,
  evidence: number,
  mode: CareerSkillMatrixItem["scoringMode"] = "hybrid"
): number {
  if (mode === "manual") return manual;
  if (mode === "evidence") return evidence;
  return Math.round(manual * 0.4 + evidence * 0.6);
}

export function computeEvidenceScore(
  skillName: string,
  input: {
    certs: CareerCertification[];
    projects: PortfolioProject[];
    courseHours?: number;
  }
): number {
  let score = 0;
  const key = skillName.toLowerCase();

  for (const cert of input.certs) {
    if (cert.status !== "done" && cert.status !== "passed") continue;
    const boosts = DEFAULT_CERT_BOOSTS[cert.name] ?? {};
    for (const [skill, boost] of Object.entries(boosts)) {
      if (skill.toLowerCase() === key || key.includes(skill.toLowerCase())) {
        score += boost;
      }
    }
    if (cert.progressPct && cert.progressPct >= 100) score += 5;
  }

  for (const p of input.projects) {
    if (p.status !== "done") continue;
    const used = p.skillsUsed.some((s) => s.toLowerCase() === key || key.includes(s.toLowerCase()));
    if (used) score += Math.min(20, (p.careerImpact ?? 10) / 2);
  }

  if (input.courseHours && input.courseHours > 10) score += Math.min(10, input.courseHours / 5);

  return Math.min(100, Math.round(score));
}

export function enrichSkillScores(
  skills: CareerSkillMatrixItem[],
  input: {
    certs: CareerCertification[];
    projects: PortfolioProject[];
  }
): CareerSkillMatrixItem[] {
  return skills.map((s) => {
    const evidence = computeEvidenceScore(s.name, { ...input, courseHours: 0 });
    const manual = s.manualScore ?? s.current;
    const current = hybridScore(manual, evidence, s.scoringMode ?? "hybrid");
    return { ...s, evidenceScore: evidence, manualScore: manual, current };
  });
}

export function projectSkillBoosts(project: PortfolioProject): Record<string, number> {
  const boost = Math.min(15, Math.round((project.careerImpact ?? 10) / 3));
  return Object.fromEntries(project.skillsUsed.map((s) => [s, boost]));
}

export function certCompletionBoosts(certName: string): Record<string, number> {
  return DEFAULT_CERT_BOOSTS[certName] ?? {};
}
