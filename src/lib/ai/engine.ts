import type { YearPayload } from "@/types/lifeos";
import type { DashboardSnapshot } from "@/types/lifeos-pro";

export interface AiInsight {
  id: string;
  type: "priority" | "risk" | "opportunity";
  title: string;
  message: string;
  action?: string;
  href?: string;
}

export function buildAiInsights(
  yearData: YearPayload,
  dashboard?: DashboardSnapshot | null
): AiInsight[] {
  const out: AiInsight[] = [];
  const lifeScore = dashboard?.scores.lifeScore ?? 0;
  const pendingTasks = dashboard?.counts.tasksDueToday ?? 0;
  const pendingHabits = dashboard?.counts.habitsPendingToday ?? 0;
  const learningHours = dashboard?.career.learningHoursWeek ?? 0;
  const riskGoals = dashboard?.counts.goalsAtRisk ?? 0;

  if (pendingTasks > 0) {
    out.push({
      id: "tasks-focus",
      type: "priority",
      title: "فلترة تركيز اليوم",
      message: `لديك ${pendingTasks} مهام مستحقة. ابدأ بـ P1 أولاً ثم أغلق أي مهمة أقل من 30 دقيقة.`,
      action: "افتح المهام",
      href: "/tasks",
    });
  }

  if (pendingHabits > 2) {
    out.push({
      id: "habits-risk",
      type: "risk",
      title: "انضباط اليوم منخفض",
      message: `متبقي ${pendingHabits} عادات. نفّذ عادة واحدة الآن لرفع Life Score بسرعة.`,
      action: "سجل عادة",
      href: "/habits",
    });
  }

  if (learningHours < 4) {
    out.push({
      id: "learning-opportunity",
      type: "opportunity",
      title: "فرصة ترقية مهنية",
      message: `ساعات التعلم الأسبوعية ${learningHours} فقط. أضف جلستين 45 دقيقة نحو FA/Senior FA.`,
      action: "افتح التعلم",
      href: "/learning",
    });
  }

  if (riskGoals > 0) {
    out.push({
      id: "goals-risk",
      type: "risk",
      title: "أهداف مهددة",
      message: `${riskGoals} هدف يحتاج تعديل الخطة أو تقسيمه لمهام أسبوعية.`,
      action: "راجع الأهداف",
      href: "/goals",
    });
  }

  if (lifeScore >= 75) {
    out.push({
      id: "momentum",
      type: "opportunity",
      title: "الزخم ممتاز",
      message: `Life Score الحالي ${lifeScore}. استثمره في مهمة عميقة للمسار المهني اليوم.`,
      action: "افتح المسار المهني",
      href: "/career",
    });
  } else {
    out.push({
      id: "recovery",
      type: "priority",
      title: "خطة استعادة سريعة",
      message: `Life Score الحالي ${lifeScore}. اكسب 10 نقاط عبر: عادة + تمرين + إغلاق مهمة واحدة.`,
      action: "لوحة التحكم",
      href: "/dashboard",
    });
  }

  const studySessions = yearData.studySessions ?? [];
  if (studySessions.length === 0) {
    out.push({
      id: "study-bootstrap",
      type: "opportunity",
      title: "ابدأ سجل جلسات التعلم",
      message: "سجّل أول جلسة تعلم اليوم لمتابعة التقدم بشكل تنفيذي أسبوعي.",
      action: "إضافة جلسة",
      href: "/learning",
    });
  }

  return out.slice(0, 8);
}

export function buildCoachReply(input: string, insights: AiInsight[]): string {
  const text = input.trim();
  if (!text) {
    return "اكتب سؤالك وسأقترح لك خطة تنفيذية قصيرة لهذا الأسبوع.";
  }
  const top = insights.slice(0, 3).map((i) => `• ${i.title}: ${i.message}`).join("\n");
  return `ملخص سريع بناءً على بياناتك:\n${top}\n\nاقتراحي: ركّز اليوم على مهمة P1 + عادة أساسية + 45 دقيقة تعلم.`;
}

export function buildExecutiveBrief(
  dashboard?: DashboardSnapshot | null,
  insights: AiInsight[] = []
) {
  const life = dashboard?.scores.lifeScore ?? 0;
  const finance = dashboard?.scores.financeScore ?? 0;
  const career = dashboard?.scores.careerScore ?? 0;
  const learning = dashboard?.scores.learningScore ?? 0;
  return {
    headline: `Life Score: ${life}/100`,
    summary: `المالية ${finance} | المهنة ${career} | التعلم ${learning}`,
    nextActions: insights.slice(0, 3).map((x) => x.title),
  };
}
