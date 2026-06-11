import type { KnowledgeGraphEdge, KnowledgeGraphNode } from "@/types/areas";

export interface LifeMapNode extends KnowledgeGraphNode {
  domainId?: string;
  domainSlug?: string;
  href?: string;
}

export interface LifeMapPayload {
  nodes: LifeMapNode[];
  edges: KnowledgeGraphEdge[];
  stats: {
    visions: number;
    goals: number;
    projects: number;
    tasks: number;
    habits: number;
    books: number;
    skills: number;
  };
}

type GoalRow = {
  id: string;
  title: string;
  level?: string;
  parent_id?: string | null;
  progress?: number;
  domain_id?: string | null;
  area?: string;
  category?: string;
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

function nodeHref(type: string, id: string, domainSlug?: string): string | undefined {
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
      return "/career";
    case "course":
    case "cert":
      return "/learning";
    default:
      return undefined;
  }
}

export function buildGlobalLifeMap(input: {
  goals: GoalRow[];
  tasks: { id: string; title: string; goal_id?: string | null }[];
  habits: { id: string; name: string; goal_id?: string | null; project_id?: string | null }[];
  books: { id: string; title: string; goal_id?: string | null; domain_id?: string | null }[];
  skills: { id: string; name: string; linked_goal_id?: string | null }[];
}): LifeMapPayload {
  const nodes: LifeMapNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];
  const seen = new Set<string>();

  function addNode(n: LifeMapNode) {
    if (seen.has(n.id)) return;
    seen.add(n.id);
    nodes.push(n);
  }

  const visions = input.goals.filter((g) => g.level === "vision");
  const topGoals = input.goals.filter((g) => g.level === "goal" || (!g.level && !g.parent_id));
  const projects = input.goals.filter((g) => g.level === "project");

  for (const v of visions) {
    const slug = v.domain_id ? DOMAIN_SLUGS[v.domain_id] : undefined;
    addNode({
      id: v.id,
      type: "goal",
      label: v.title,
      progress: v.progress,
      domainId: v.domain_id ?? undefined,
      domainSlug: slug,
      href: nodeHref("vision", v.id, slug),
    });
  }

  for (const g of topGoals) {
    const slug = g.domain_id ? DOMAIN_SLUGS[g.domain_id] : undefined;
    const parentVision = g.parent_id && visions.find((v) => v.id === g.parent_id);
    addNode({
      id: g.id,
      type: "goal",
      label: g.title,
      progress: g.progress,
      domainId: g.domain_id ?? undefined,
      domainSlug: slug,
      href: nodeHref("goal", g.id, slug),
    });
    if (parentVision) edges.push({ from: parentVision.id, to: g.id });
  }

  for (const p of projects) {
    const slug = p.domain_id ? DOMAIN_SLUGS[p.domain_id] : undefined;
    const parent = p.parent_id ? input.goals.find((g) => g.id === p.parent_id) : undefined;
    addNode({
      id: p.id,
      type: "project",
      label: p.title,
      progress: p.progress,
      domainId: p.domain_id ?? undefined,
      domainSlug: slug,
      href: nodeHref("project", p.id, slug),
    });
    if (parent) edges.push({ from: parent.id, to: p.id });
  }

  for (const h of input.habits) {
    addNode({
      id: h.id,
      type: "habit",
      label: h.name,
      href: nodeHref("habit", h.id),
    });
    const link = h.project_id ?? h.goal_id;
    if (link) edges.push({ from: link, to: h.id });
  }

  for (const t of input.tasks) {
    addNode({ id: t.id, type: "task", label: t.title, href: nodeHref("task", t.id) });
    if (t.goal_id) edges.push({ from: t.goal_id, to: t.id });
  }

  for (const b of input.books) {
    const slug = b.domain_id ? DOMAIN_SLUGS[b.domain_id] : undefined;
    addNode({
      id: b.id,
      type: "book",
      label: b.title,
      domainId: b.domain_id ?? undefined,
      domainSlug: slug,
      href: nodeHref("book", b.id),
    });
    if (b.goal_id) edges.push({ from: b.goal_id, to: b.id });
  }

  for (const s of input.skills) {
    addNode({ id: s.id, type: "skill", label: s.name, href: nodeHref("skill", s.id) });
    if (s.linked_goal_id) edges.push({ from: s.linked_goal_id, to: s.id });
  }

  return {
    nodes,
    edges,
    stats: {
      visions: visions.length,
      goals: topGoals.length,
      projects: projects.length,
      tasks: input.tasks.length,
      habits: input.habits.length,
      books: input.books.length,
      skills: input.skills.length,
    },
  };
}
