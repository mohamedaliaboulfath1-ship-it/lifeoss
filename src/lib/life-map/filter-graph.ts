import { CENTER_NODE_ID, LIFE_MAP_HUBS } from "./hubs";
import type { LifeMapEdge, LifeMapNode, LifeMapPayload } from "./types";

/** Primary life-area hubs shown in overview (keeps canvas light) */
export const OVERVIEW_HUB_IDS = [
  "hub_body",
  "hub_career",
  "hub_finance",
  "hub_learning",
  "hub_books",
  "hub_soul",
] as const;

const ENTITY_TYPES = new Set([
  "vision", "goal", "project", "task", "habit", "book",
  "skill", "course", "cert", "resource", "learning_path", "weight", "finance",
]);

export function countHubChildren(hubId: string, payload: LifeMapPayload): number {
  let count = 0;
  for (const n of payload.nodes) {
    if (n.hubId === hubId && n.type !== "area" && n.type !== "center") count++;
  }
  for (const e of payload.edges) {
    if (e.from === hubId && ENTITY_TYPES.has(payload.nodes.find((n) => n.id === e.to)?.type ?? "")) count++;
  }
  return count;
}

export function enrichHubCounts(payload: LifeMapPayload): LifeMapPayload {
  const nodes = payload.nodes.map((n) => {
    if (n.type !== "area") return n;
    const childCount = countHubChildren(n.id, payload);
    return {
      ...n,
      description: childCount > 0 ? `${childCount} عنصر مرتبط` : "لا عناصر بعد",
    };
  });
  return { ...payload, nodes };
}

/** Overview: center + 6 main hubs only (~7 nodes) */
export function getOverviewGraph(payload: LifeMapPayload): { nodes: LifeMapNode[]; edges: LifeMapEdge[] } {
  const hubSet = new Set<string>(OVERVIEW_HUB_IDS as unknown as string[]);
  const nodes = payload.nodes.filter(
    (n) => n.id === CENTER_NODE_ID || (n.type === "area" && hubSet.has(n.id))
  );
  const ids = new Set(nodes.map((n) => n.id));
  const edges = payload.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  return { nodes, edges };
}

/** Branch: one hub + its children (capped for performance) */
export function getBranchGraph(
  payload: LifeMapPayload,
  hubId: string,
  maxChildren = 32
): { nodes: LifeMapNode[]; edges: LifeMapEdge[] } {
  const hub = payload.nodes.find((n) => n.id === hubId);
  if (!hub) return getOverviewGraph(payload);

  const childIds = new Set<string>();

  for (const n of payload.nodes) {
    if (n.hubId === hubId && n.id !== hubId && n.type !== "center") childIds.add(n.id);
  }
  for (const e of payload.edges) {
    if (e.from === hubId) childIds.add(e.to);
  }

  // One hop deeper (goal → habit/task)
  const direct = [...childIds];
  for (const id of direct) {
    for (const e of payload.edges) {
      if (e.from === id && e.kind === "linked") childIds.add(e.to);
    }
  }

  const children = payload.nodes
    .filter((n) => childIds.has(n.id) && n.type !== "area" && n.type !== "center")
    .sort((a, b) => {
      const priority: Record<string, number> = {
        vision: 0, goal: 1, project: 2, habit: 3, task: 4, book: 5,
        course: 6, cert: 7, skill: 8, learning_path: 9, weight: 10, finance: 11, resource: 12,
      };
      const pa = priority[a.type] ?? 20;
      const pb = priority[b.type] ?? 20;
      if (pa !== pb) return pa - pb;
      return (b.progress ?? 0) - (a.progress ?? 0);
    })
    .slice(0, maxChildren);

  const childIdSet = new Set(children.map((n) => n.id));
  const center = payload.nodes.find((n) => n.id === CENTER_NODE_ID);
  const nodes = [center, hub, ...children].filter(Boolean) as LifeMapNode[];
  const ids = new Set(nodes.map((n) => n.id));

  const edges = payload.edges.filter(
    (e) => ids.has(e.from) && ids.has(e.to) && e.kind !== "hub"
  );
  // Re-add hub spoke from center in branch view
  if (center) edges.unshift({ from: CENTER_NODE_ID, to: hubId, kind: "hub", weight: 2 });

  return { nodes, edges };
}

/** Full map capped */
export function getFullGraph(payload: LifeMapPayload, maxNodes = 120): { nodes: LifeMapNode[]; edges: LifeMapEdge[] } {
  if (payload.nodes.length <= maxNodes) return { nodes: payload.nodes, edges: payload.edges };
  const hubs = payload.nodes.filter((n) => n.type === "area" || n.type === "center");
  const hubIds = new Set(hubs.map((n) => n.id));
  const rest = payload.nodes
    .filter((n) => !hubIds.has(n.id))
    .slice(0, maxNodes - hubs.length);
  const nodes = [...hubs, ...rest];
  const ids = new Set(nodes.map((n) => n.id));
  const edges = payload.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  return { nodes, edges };
}

export function getHubList(payload: LifeMapPayload) {
  return LIFE_MAP_HUBS.map((h) => {
    const live = payload.nodes.find((n) => n.id === h.id);
    return {
      ...h,
      healthScore: live?.healthScore,
      trend: live?.trend,
      riskLevel: live?.riskLevel,
      childCount: countHubChildren(h.id, payload),
    };
  });
}
