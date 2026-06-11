import { calcAreaHealthScore } from "@/lib/areas/scores";
import { SYSTEM_DOMAINS } from "@/lib/domains";
import {
  CENTER_NODE_ID,
  DOMAIN_TO_HUB,
  LIFE_MAP_HUBS,
  TYPE_TO_HUB,
} from "./hubs";
import type {
  LifeMapAreaHealth,
  LifeMapEdge,
  LifeMapNode,
  LifeMapPayload,
  LifeMapRiskLevel,
} from "./types";

export type { LifeMapNode, LifeMapPayload, LifeMapEdge } from "./types";

type GoalRow = {
  id: string;
  title: string;
  level?: string;
  parent_id?: string | null;
  progress?: number;
  status?: string;
  domain_id?: string | null;
  area?: string;
  category?: string;
  description?: string;
};

const DOMAIN_SLUGS: Record<string, string> = {
  domain_body: "body",
  domain_finance: "finance",
  domain_career: "career",
  domain_learning: "learning",
  domain_relationships: "relationships",
  domain_spiritual: "spiritual",
  domain_self_dev: "self_development",
  domain_discipline: "discipline",
};

function riskFromProgress(progress?: number, status?: string): LifeMapRiskLevel {
  if (status === "done") return "low";
  if (progress == null) return "medium";
  if (progress < 25) return "high";
  if (progress < 50) return "medium";
  return "low";
}

function nodeHref(type: string, domainSlug?: string): string | undefined {
  switch (type) {
    case "vision":
    case "goal":
    case "project":
      return domainSlug ? `/areas/${domainSlug}#goals` : "/goals";
    case "task":
      return "/tasks";
    case "habit":
      return "/habits";
    case "book":
      return "/books";
    case "skill":
    case "cert":
      return "/career";
    case "course":
    case "learning_path":
      return "/learning";
    case "resource":
      return "/resources";
    case "weight":
      return "/weight";
    case "finance":
      return "/finance";
    default:
      return undefined;
  }
}

function resolveHubId(
  type: string,
  domainId?: string | null,
): string {
  if (type === "book") return "hub_books";
  if (type === "cert") return "hub_career";
  if (domainId && DOMAIN_TO_HUB[domainId]) return DOMAIN_TO_HUB[domainId];
  return TYPE_TO_HUB[type] ?? "hub_resources";
}

export function buildGlobalLifeMap(input: {
  goals: GoalRow[];
  tasks: { id: string; title: string; goal_id?: string | null; status?: string; domain_id?: string | null }[];
  habits: {
    id: string;
    name: string;
    goal_id?: string | null;
    project_id?: string | null;
    domain_id?: string | null;
    adherence?: number;
  }[];
  books: {
    id: string;
    title: string;
    goal_id?: string | null;
    domain_id?: string | null;
    cur_page?: number;
    pages?: number;
    status?: string;
  }[];
  skills: { id: string; name: string; linked_goal_id?: string | null; domain_id?: string | null; progress?: number }[];
  courses: {
    id: string;
    title: string;
    linked_goal_id?: string | null;
    domain_id?: string | null;
    progress?: number;
    status?: string;
  }[];
  certs: {
    id: string;
    name: string;
    linked_goal_id?: string | null;
    domain_id?: string | null;
    progress_pct?: number;
    status?: string;
  }[];
  learningPaths: { id: string; title: string; progress?: number }[];
  resources: { id: string; title: string; domain_id?: string | null; resource_type?: string }[];
  habitLinks: { goal_id: string; habit_id: string }[];
  weightLogs: { id: string; weight: number; log_date: string }[];
  financeSummary?: { netWorth?: number; savings?: number; debts?: number };
  profile?: { current_weight?: number | null; target_weight?: number | null };
}): LifeMapPayload {
  const nodes: LifeMapNode[] = [];
  const edges: LifeMapEdge[] = [];
  const seen = new Set<string>();

  function addNode(n: LifeMapNode) {
    if (seen.has(n.id)) return;
    seen.add(n.id);
    nodes.push(n);
  }

  function addEdge(from: string, to: string, kind: LifeMapEdge["kind"] = "linked", weight = 1) {
    const key = `${from}->${to}`;
    if (edges.some((e) => `${e.from}->${e.to}` === key)) return;
    edges.push({ from, to, kind, weight });
  }

  // Center + branch hubs
  addNode({
    id: CENTER_NODE_ID,
    type: "center",
    label: "LIFEOS",
    icon: "✦",
    color: "var(--gold)",
    description: "مركز نظام تشغيل حياتك",
  });

  for (const hub of LIFE_MAP_HUBS) {
    addNode({ ...hub, href: hub.domainSlug ? `/areas/${hub.domainSlug}` : undefined });
    addEdge(CENTER_NODE_ID, hub.id, "hub", 3);
  }

  const visions = input.goals.filter((g) => g.level === "vision");
  const topGoals = input.goals.filter((g) => g.level === "goal" || (!g.level && !g.parent_id));
  const projects = input.goals.filter((g) => g.level === "project");

  for (const v of visions) {
    const slug = v.domain_id ? DOMAIN_SLUGS[v.domain_id] : undefined;
    const hubId = resolveHubId("vision", v.domain_id);
    const progress = v.progress ?? 0;
    addNode({
      id: v.id,
      type: "vision",
      label: v.title,
      progress,
      status: progress >= 100 ? "completed" : "normal",
      riskLevel: riskFromProgress(progress, v.status),
      domainId: v.domain_id ?? undefined,
      domainSlug: slug,
      hubId,
      href: nodeHref("vision", slug),
      description: v.description,
      icon: "🔭",
    });
    addEdge(hubId, v.id, "domain", 2);
  }

  for (const g of topGoals) {
    const slug = g.domain_id ? DOMAIN_SLUGS[g.domain_id] : undefined;
    const hubId = resolveHubId("goal", g.domain_id);
    const parentVision = g.parent_id && visions.find((v) => v.id === g.parent_id);
    const progress = g.progress ?? 0;
    const atRisk = progress < 30 && g.status === "active";
    addNode({
      id: g.id,
      type: "goal",
      label: g.title,
      progress,
      status: progress >= 100 ? "completed" : atRisk ? "at_risk" : "normal",
      riskLevel: riskFromProgress(progress, g.status),
      domainId: g.domain_id ?? undefined,
      domainSlug: slug,
      hubId,
      href: nodeHref("goal", slug),
      description: g.description,
      icon: "🎯",
    });
    addEdge(hubId, g.id, "domain", 2);
    if (parentVision) addEdge(parentVision.id, g.id, "parent", 3);
  }

  for (const p of projects) {
    const slug = p.domain_id ? DOMAIN_SLUGS[p.domain_id] : undefined;
    const hubId = resolveHubId("project", p.domain_id);
    const parent = p.parent_id ? input.goals.find((g) => g.id === p.parent_id) : undefined;
    const progress = p.progress ?? 0;
    addNode({
      id: p.id,
      type: "project",
      label: p.title,
      progress,
      status: progress >= 100 ? "completed" : "normal",
      riskLevel: riskFromProgress(progress, p.status),
      domainId: p.domain_id ?? undefined,
      domainSlug: slug,
      hubId,
      href: nodeHref("project", slug),
      description: p.description,
      icon: "📁",
    });
    addEdge(hubId, p.id, "domain", 2);
    if (parent) addEdge(parent.id, p.id, "parent", 3);
  }

  for (const h of input.habits) {
    const hubId = resolveHubId("habit", h.domain_id);
    addNode({
      id: h.id,
      type: "habit",
      label: h.name,
      progress: h.adherence,
      status: (h.adherence ?? 0) < 40 ? "at_risk" : "normal",
      riskLevel: (h.adherence ?? 50) < 40 ? "high" : "low",
      hubId,
      href: nodeHref("habit"),
      icon: "🔄",
    });
    addEdge(hubId, h.id, "domain", 1);

    const links = new Set<string>();
    if (h.project_id) links.add(h.project_id);
    if (h.goal_id) links.add(h.goal_id);
    for (const l of input.habitLinks) {
      if (l.habit_id === h.id) links.add(l.goal_id);
    }
    for (const link of links) {
      if (seen.has(link)) addEdge(link, h.id, "linked", 2);
    }
  }

  for (const t of input.tasks) {
    const hubId = resolveHubId("task", t.domain_id);
    addNode({
      id: t.id,
      type: "task",
      label: t.title,
      status: t.status === "done" ? "completed" : "normal",
      hubId,
      href: nodeHref("task"),
      icon: "✅",
    });
    addEdge(hubId, t.id, "domain", 1);
    if (t.goal_id && seen.has(t.goal_id)) addEdge(t.goal_id, t.id, "linked", 2);
  }

  for (const b of input.books) {
    const slug = b.domain_id ? DOMAIN_SLUGS[b.domain_id] : undefined;
    const pct = b.pages ? Math.round(((b.cur_page ?? 0) / b.pages) * 100) : undefined;
    addNode({
      id: b.id,
      type: "book",
      label: b.title,
      progress: pct,
      status: b.status === "done" ? "completed" : "normal",
      domainId: b.domain_id ?? undefined,
      domainSlug: slug,
      hubId: "hub_books",
      href: nodeHref("book"),
      icon: "📚",
    });
    addEdge("hub_books", b.id, "domain", 2);
    if (b.goal_id && seen.has(b.goal_id)) addEdge(b.goal_id, b.id, "linked", 2);
  }

  for (const s of input.skills) {
    const hubId = resolveHubId("skill", s.domain_id);
    addNode({
      id: s.id,
      type: "skill",
      label: s.name,
      progress: s.progress,
      hubId,
      href: nodeHref("skill"),
      icon: "⚡",
    });
    addEdge(hubId, s.id, "domain", 1);
    if (s.linked_goal_id && seen.has(s.linked_goal_id)) addEdge(s.linked_goal_id, s.id, "linked", 2);
  }

  for (const c of input.courses) {
    const hubId = resolveHubId("course", c.domain_id);
    addNode({
      id: c.id,
      type: "course",
      label: c.title,
      progress: c.progress,
      status: c.status === "done" ? "completed" : "normal",
      hubId,
      href: nodeHref("course"),
      icon: "🎓",
    });
    addEdge(hubId, c.id, "domain", 2);
    if (c.linked_goal_id && seen.has(c.linked_goal_id)) addEdge(c.linked_goal_id, c.id, "linked", 2);
  }

  for (const c of input.certs) {
    addNode({
      id: c.id,
      type: "cert",
      label: c.name,
      progress: c.progress_pct,
      status: c.status === "done" ? "completed" : "normal",
      hubId: "hub_career",
      href: nodeHref("cert"),
      icon: "🏅",
    });
    addEdge("hub_career", c.id, "domain", 2);
    if (c.linked_goal_id && seen.has(c.linked_goal_id)) addEdge(c.linked_goal_id, c.id, "linked", 2);
  }

  for (const lp of input.learningPaths) {
    const hubId = resolveHubId("learning_path");
    addNode({
      id: lp.id,
      type: "learning_path",
      label: lp.title,
      progress: lp.progress,
      hubId,
      href: nodeHref("learning_path"),
      icon: "🛤️",
    });
    addEdge(hubId, lp.id, "domain", 2);
  }

  for (const r of input.resources) {
    const hubId = resolveHubId("resource", r.domain_id);
    addNode({
      id: r.id,
      type: "resource",
      label: r.title,
      hubId,
      href: nodeHref("resource"),
      icon: "📦",
    });
    addEdge(hubId, r.id, "domain", 1);
  }

  if (input.weightLogs.length > 0) {
    const latest = input.weightLogs[input.weightLogs.length - 1];
    const target = input.profile?.target_weight;
    const current = input.profile?.current_weight ?? latest.weight;
    const bodyProgress =
      target && current
        ? Math.min(100, Math.round((current / target) * 100))
        : undefined;
    addNode({
      id: "weight_latest",
      type: "weight",
      label: `${latest.weight} كجم`,
      progress: bodyProgress,
      hubId: "hub_body",
      href: nodeHref("weight"),
      description: `آخر قياس: ${latest.log_date}`,
      icon: "⚖️",
    });
    addEdge("hub_body", "weight_latest", "linked", 2);

    const bodyGoals = topGoals.filter((g) => g.domain_id === "domain_body");
    for (const bg of bodyGoals.slice(0, 2)) {
      addEdge(bg.id, "weight_latest", "linked", 2);
    }
  }

  if (input.financeSummary) {
    const { netWorth, savings, debts } = input.financeSummary;
    if (netWorth != null) {
      addNode({
        id: "finance_net_worth",
        type: "finance",
        label: `صافي الثروة`,
        progress: savings && debts ? Math.min(100, Math.round((savings / Math.max(debts, 1)) * 50)) : undefined,
        hubId: "hub_finance",
        href: nodeHref("finance"),
        description: `${netWorth.toLocaleString("ar-SA")} ر.س`,
        icon: "💎",
      });
      addEdge("hub_finance", "finance_net_worth", "linked", 2);
    }
  }

  // Area health overlay
  const areaHealth: LifeMapAreaHealth[] = SYSTEM_DOMAINS.map((d) => {
    const domainGoals = input.goals.filter((g) => g.domain_id === d.id && g.level !== "project");
    const domainHabits = input.habits.filter((h) => h.domain_id === d.id);
    const domainTasks = input.tasks.filter((t) => t.domain_id === d.id);
    const domainBooks = input.books.filter((b) => b.domain_id === d.id);
    const booksProgress = domainBooks.map((b) =>
      b.pages ? Math.round(((b.cur_page ?? 0) / b.pages) * 100) : 0
    );

    const { score } = calcAreaHealthScore({
      domainId: d.id,
      goals: domainGoals,
      habits: domainHabits.map((h) => ({ adherencePct: h.adherence ?? 50 })),
      tasksDone: domainTasks.filter((t) => t.status === "done").length,
      tasksTotal: domainTasks.length,
      booksProgress,
      bodyProgress:
        d.id === "domain_body" && input.profile?.target_weight && input.profile?.current_weight
          ? Math.min(100, Math.round((input.profile.current_weight / input.profile.target_weight) * 100))
          : undefined,
      financeScore:
        d.id === "domain_finance" && input.financeSummary?.savings
          ? Math.min(100, Math.round(input.financeSummary.savings / 1000))
          : undefined,
    });

    const hub = LIFE_MAP_HUBS.find((h) => h.domainId === d.id);
    if (hub) {
      const hubNode = nodes.find((n) => n.id === hub.id);
      if (hubNode) {
        hubNode.healthScore = score;
        hubNode.progress = score;
        hubNode.riskLevel = score < 40 ? "high" : score < 65 ? "medium" : "low";
        hubNode.trend = score >= 70 ? "up" : score < 45 ? "down" : "stable";
      }
    }

    return {
      domainId: d.id,
      slug: d.slug,
      nameAr: d.nameAr,
      icon: d.icon ?? "•",
      color: d.color ?? "var(--gold)",
      healthScore: score,
      trend: score >= 70 ? "up" as const : score < 45 ? "down" as const : "stable" as const,
      riskLevel: (score < 40 ? "high" : score < 65 ? "medium" : "low") as LifeMapRiskLevel,
    };
  });

  return {
    nodes,
    edges,
    areaHealth,
    stats: {
      visions: visions.length,
      goals: topGoals.length,
      projects: projects.length,
      tasks: input.tasks.length,
      habits: input.habits.length,
      books: input.books.length,
      skills: input.skills.length,
      courses: input.courses.length,
      certs: input.certs.length,
      resources: input.resources.length,
      learningPaths: input.learningPaths.length,
    },
  };
}
