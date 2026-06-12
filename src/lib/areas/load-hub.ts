import type { SupabaseClient } from "@supabase/supabase-js";
import { buildWealthSnapshot } from "@/lib/wealth/snapshot";
import { fetchAreasSharedData, buildAreaHubFromShared } from "@/lib/areas/shared-data";
import { getWeekDates } from "@/lib/utils";
import type {
  AreaHubPayload,
  AreaPreview,
  AreasOverviewStats,
  GoalDrillDown,
} from "@/types/areas";

type DomainRow = { id: string; slug: string; name_ar: string; icon: string; color: string };

export async function loadAreaHub(
  db: SupabaseClient,
  userId: string,
  domainId: string,
  domain: DomainRow
): Promise<AreaHubPayload> {
  const shared = await fetchAreasSharedData(db, userId);
  const wealth =
    domainId === "domain_finance" ? await buildWealthSnapshot(db, userId) : undefined;
  return buildAreaHubFromShared(shared, domainId, domain, wealth);
}

export async function loadAreasOverview(
  db: SupabaseClient,
  userId: string
): Promise<{ previews: AreaPreview[]; stats: AreasOverviewStats }> {
  const { data: domains } = await db
    .from("life_domains")
    .select("id, slug, name_ar, icon, color")
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .eq("is_active", true)
    .order("sort_order");

  const areas = domains ?? [];
  const shared = await fetchAreasSharedData(db, userId);
  const hasFinance = areas.some((d) => d.id === "domain_finance");
  const wealth = hasFinance ? await buildWealthSnapshot(db, userId) : undefined;
  const hubs = areas.map((d) =>
    buildAreaHubFromShared(shared, d.id, d, d.id === "domain_finance" ? wealth : undefined)
  );
  const weekEnd = getWeekDates(0)[6];

  const previews = areas.map((d, i) => {
    const hub = hubs[i];
    return {
      id: d.id,
      slug: d.slug,
      nameAr: d.name_ar,
      icon: d.icon,
      color: d.color,
      healthScore: hub.healthScore,
      scoreReasons: hub.scoreReasons,
      activeGoals: hub.counts.goals,
      habits: hub.counts.habits,
      tasks: hub.counts.tasks,
      books: hub.counts.books,
      projects: hub.counts.projects,
      highlights: buildPreviewHighlights(d.id, hub),
      needsAttention: hub.coach.filter((c) => c.priority === "high").map((c) => c.message),
      currentFocus: buildCurrentFocus(hub),
      nextAction: buildNextAction(hub),
    };
  });

  const tasksThisWeek = hubs.reduce((sum, hub) => {
    const weekTasks = hub.tasks.filter(
      (t) =>
        t.status !== "done" &&
        t.dueDate &&
        t.dueDate >= getWeekDates(0)[0] &&
        t.dueDate <= weekEnd
    );
    return sum + weekTasks.length;
  }, 0);

  const stats: AreasOverviewStats = {
    lifeScore: previews.length
      ? Math.round(previews.reduce((s, p) => s + p.healthScore, 0) / previews.length)
      : 0,
    activeGoals: previews.reduce((s, p) => s + p.activeGoals, 0),
    activeProjects: previews.reduce((s, p) => s + p.projects, 0),
    habits: previews.reduce((s, p) => s + p.habits, 0),
    tasksThisWeek,
    areasNeedingAttention: previews.filter((p) => p.needsAttention.length > 0).length,
  };

  return { previews, stats };
}

function buildCurrentFocus(hub: AreaHubPayload): string {
  if (hub.goals[0]) return hub.goals[0].title;
  if (hub.projects[0]) return hub.projects[0].title;
  if (hub.metrics[0]) return `${hub.metrics[0].label}: ${hub.metrics[0].value}`;
  if (hub.books.current[0]) return hub.books.current[0].title;
  return "حدد تركيزك القادم";
}

function buildNextAction(hub: AreaHubPayload): string {
  const highCoach = hub.coach.find((c) => c.priority === "high");
  if (highCoach?.action) return highCoach.action;
  if (highCoach?.message) return highCoach.message;
  if (hub.tasksDueToday[0]) return hub.tasksDueToday[0].title;
  if (hub.tasksOverdue[0]) return hub.tasksOverdue[0].title;
  if (hub.coach[0]?.message) return hub.coach[0].message;
  return "راجع المجال وحدّث خطتك";
}

export function loadGoalDrillDown(hub: AreaHubPayload, goalId: string): GoalDrillDown | null {
  const goal = hub.goals.find((g) => g.id === goalId);
  if (!goal) return null;
  return {
    goal,
    projects: hub.projects.filter((p) => p.goalId === goalId),
    tasks: hub.tasks.filter((t) => t.goalId === goalId),
    habits: hub.habits.filter((h) => h.goalLink === goalId),
    metrics: hub.scoreReasons.map((r, i) => ({ label: `مؤشر ${i + 1}`, value: r })),
    forecast: goal.completion?.probabilityText,
  };
}

function buildPreviewHighlights(_domainId: string, hub: AreaHubPayload): { label: string; value: string }[] {
  const h = [...hub.metrics];
  h.push(
    { label: "Life Score", value: `${hub.healthScore}%` },
    { label: "أهداف", value: String(hub.counts.goals) },
    { label: "عادات", value: String(hub.counts.habits) },
    { label: "مهام", value: String(hub.counts.tasks) }
  );
  if (hub.books.current[0]) {
    h.push({ label: "كتاب حالي", value: `${hub.books.current[0].title} ${hub.books.current[0].progress}%` });
  }
  if (hub.courses.current[0]) {
    h.push({ label: "دورة", value: `${hub.courses.current[0].title} ${hub.courses.current[0].progress}%` });
  }
  return h.slice(0, 6);
}
