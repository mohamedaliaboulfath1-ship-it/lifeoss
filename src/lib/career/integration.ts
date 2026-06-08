import type { CareerRoadmapStage } from "@/types/lifeos";

type IntegrationGoal = { id: string; title: string; area?: string; category?: string; progress?: number };
type IntegrationHabit = { id: string; name: string; cat?: string; goalLink?: string };
type IntegrationBook = { id: string; title: string; category?: string; progress?: number };

export interface CareerIntegrationItem {
  id: string;
  title: string;
  type: "goal" | "habit" | "book" | "task";
  progress?: number;
  linked?: boolean;
  url?: string;
}

export interface CareerSuggestion {
  id: string;
  icon: string;
  label: string;
  reason: string;
  actionUrl?: string;
}

export interface CareerIntegrations {
  goals: CareerIntegrationItem[];
  habits: CareerIntegrationItem[];
  books: CareerIntegrationItem[];
  suggestions: CareerSuggestion[];
}

export function buildCareerIntegrations(input: {
  activeStage: CareerRoadmapStage | null;
  goals: IntegrationGoal[];
  habits: IntegrationHabit[];
  books: IntegrationBook[];
}): CareerIntegrations {
  const stage = input.activeStage;
  const requiredSkills = stage?.requiredSkills ?? stage?.focus ?? [];
  const requiredCerts = stage?.requiredCerts ?? [];

  const careerGoals = input.goals.filter(
    (g) => g.area === "career" || g.category === "career"
  );

  const linkedGoalIds = new Set(careerGoals.map((g) => g.id));
  const careerHabits = input.habits.filter(
    (h) => h.cat === "career" || (h.goalLink && linkedGoalIds.has(h.goalLink))
  );

  const careerBooks = input.books.filter((b) => {
    const cat = b.category ?? "";
    const title = b.title.toLowerCase();
    return (
      cat === "career" ||
      cat === "finance" ||
      requiredSkills.some((s) => title.includes(s.toLowerCase().slice(0, 6)))
    );
  });

  const suggestions: CareerSuggestion[] = [];

  if (stage) {
    for (const skill of requiredSkills.slice(0, 3)) {
      suggestions.push({
        id: `skill-${skill}`,
        icon: "🧩",
        label: `طوّر مهارة: ${skill}`,
        reason: `مطلوبة لمرحلة ${stage.title}`,
        actionUrl: "/career",
      });
    }
    for (const cert of requiredCerts.slice(0, 2)) {
      suggestions.push({
        id: `cert-${cert}`,
        icon: "🏅",
        label: `شهادة: ${cert}`,
        reason: `مطلوبة للوصول إلى ${stage.title}`,
        actionUrl: "/career",
      });
    }
  }

  if (!careerGoals.length && stage) {
    suggestions.push({
      id: "goal-create",
      icon: "🎯",
      label: `هدف: الوصول إلى ${stage.title}`,
      reason: "اربط هدفاً مهنياً لتتبع التقدم",
      actionUrl: "/goals",
    });
  }

  if (!careerHabits.length) {
    suggestions.push({
      id: "habit-study",
      icon: "📚",
      label: "عادة: ساعة تعلم يومية",
      reason: "العادات المهنية ترفع الجاهزية",
      actionUrl: "/habits",
    });
  }

  if (careerBooks.length < 2) {
    suggestions.push({
      id: "book-finance",
      icon: "📖",
      label: "أضف كتاباً مهنياً",
      reason: "القراءة تغذي المهارات والشهادات",
      actionUrl: "/books",
    });
  }

  return {
    goals: careerGoals.map((g) => ({
      id: g.id,
      title: g.title,
      type: "goal" as const,
      progress: g.progress,
      linked: stage?.requiredSkills?.some((s) => g.title.toLowerCase().includes(s.toLowerCase())),
      url: "/goals",
    })),
    habits: careerHabits.map((h) => ({
      id: h.id,
      title: h.name,
      type: "habit" as const,
      linked: Boolean(h.goalLink),
      url: "/habits",
    })),
    books: careerBooks.slice(0, 8).map((b) => ({
      id: b.id,
      title: b.title,
      type: "book" as const,
      progress: b.progress,
      url: "/books",
    })),
    suggestions: suggestions.slice(0, 8),
  };
}
