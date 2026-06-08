import type { DashboardInsight } from "@/types/lifeos-pro";
import type {
  CareerCertification,
  CareerRoadmapStage,
  CareerSkillMatrixItem,
} from "@/types/lifeos";
import type { CareerReadiness } from "@/lib/career/readiness";
import { certCompletionBoosts } from "@/lib/career/skill-engine";

export function buildCareerCoachInsights(input: {
  readiness: CareerReadiness;
  skills: CareerSkillMatrixItem[];
  certs: CareerCertification[];
  roadmap: CareerRoadmapStage[];
  targetRole?: string;
}): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  const target = input.targetRole ?? input.roadmap[input.roadmap.length - 1]?.title ?? "الهدف المهني";

  const activeStage = input.roadmap.find((r) => r.status === "active") ?? input.roadmap[0];
  if (activeStage) {
    insights.push({
      id: "career-stage-progress",
      icon: "🎯",
      message: `أنت الآن عند ${input.readiness.score}% من متطلبات ${activeStage.title}`,
      action: "عرض المسار",
      actionUrl: "/career",
      priority: "high",
    });
  }

  const gaps = [...input.skills]
    .map((s) => ({ name: s.name, gap: Math.max(0, s.target - s.current) }))
    .sort((a, b) => b.gap - a.gap);

  if (gaps[0]?.gap >= 15) {
    insights.push({
      id: "career-skill-gap",
      icon: "📊",
      message: `أكبر فجوة لديك هي ${gaps[0].name} (${gaps[0].gap}%)`,
      action: "تحسين المهارات",
      actionUrl: "/career",
      priority: "normal",
    });
  }

  const studying = input.certs.find((c) => c.status === "studying" || c.status === "active");
  if (studying) {
    const boosts = certCompletionBoosts(studying.name);
    const topBoost = Object.entries(boosts).sort((a, b) => b[1] - a[1])[0];
    const projected = Math.min(100, input.readiness.score + (studying.careerImpactScore ?? 12));
    insights.push({
      id: "career-cert-boost",
      icon: "🏅",
      message: `إكمال ${studying.name} سيرفع جاهزيتك إلى ~${projected}%${topBoost ? ` ويرفع ${topBoost[0]}` : ""}`,
      action: "متابعة الشهادة",
      actionUrl: "/career",
      priority: "normal",
    });
  }

  const highRoi = input.certs
    .filter((c) => c.status === "planned")
    .sort((a, b) => (b.careerImpactScore ?? 0) - (a.careerImpactScore ?? 0))[0];
  if (highRoi) {
    insights.push({
      id: "career-roi",
      icon: "⚡",
      message: `أفضل عائد على الوقت حالياً هو ${highRoi.name}`,
      action: "بدء الدراسة",
      actionUrl: "/career",
      priority: "low",
    });
  }

  if (input.readiness.forecastYears != null) {
    insights.push({
      id: "career-forecast",
      icon: "🗓️",
      message: `بالمعدل الحالي ستصل إلى ${target} خلال ${input.readiness.forecastYears} سنوات`,
      action: "تسريع الخطة",
      actionUrl: "/career",
      priority: "low",
    });
  }

  return insights.slice(0, 5);
}
