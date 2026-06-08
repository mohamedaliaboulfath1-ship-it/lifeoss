export interface AreaScoreInput {
  domainId: string;
  goals: { progress?: number; status?: string }[];
  habits: { adherencePct: number }[];
  tasksDone: number;
  tasksTotal: number;
  booksProgress: number[];
  bodyProgress?: number;
  financeScore?: number;
  careerScore?: number;
  learningHours?: number;
}

export function calcAreaHealthScore(input: AreaScoreInput): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const goalAvg =
    input.goals.length > 0
      ? Math.round(input.goals.reduce((s, g) => s + (g.progress ?? 0), 0) / input.goals.length)
      : 0;
  const habitAvg =
    input.habits.length > 0
      ? Math.round(input.habits.reduce((s, h) => s + h.adherencePct, 0) / input.habits.length)
      : 50;
  const taskPct =
    input.tasksTotal > 0 ? Math.round((input.tasksDone / input.tasksTotal) * 100) : 50;
  const bookAvg =
    input.booksProgress.length > 0
      ? Math.round(input.booksProgress.reduce((s, p) => s + p, 0) / input.booksProgress.length)
      : 0;

  let score = Math.round(goalAvg * 0.35 + habitAvg * 0.3 + taskPct * 0.2 + bookAvg * 0.15);

  if (input.domainId === "domain_body" && input.bodyProgress != null) {
    score = Math.round(score * 0.4 + input.bodyProgress * 0.6);
    reasons.push(`تقدم الوزن: ${input.bodyProgress}%`);
  }
  if (input.domainId === "domain_finance" && input.financeScore != null) {
    score = Math.round(score * 0.3 + input.financeScore * 0.7);
    reasons.push(`الصحة المالية: ${input.financeScore}%`);
  }
  if (input.domainId === "domain_career" && input.careerScore != null) {
    score = Math.round(score * 0.3 + input.careerScore * 0.7);
    reasons.push(`جاهزية مهنية: ${input.careerScore}%`);
  }
  if (input.domainId === "domain_learning") {
    const learnBonus = Math.min(20, Math.round((input.learningHours ?? 0) * 4));
    score = Math.min(100, score + learnBonus);
    if (input.learningHours) reasons.push(`${input.learningHours}س تعلم هذا الأسبوع`);
  }

  if (goalAvg > 0) reasons.push(`متوسط الأهداف: ${goalAvg}%`);
  if (habitAvg > 0) reasons.push(`التزام العادات: ${habitAvg}%`);
  if (habitAvg < 50 && input.habits.length > 0) reasons.push("العادات تحتاج انتباه");

  return { score: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0, 4) };
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "ممتاز";
  if (score >= 65) return "جيد";
  if (score >= 45) return "متوسط";
  return "يحتاج تحسين";
}
