import dagre from "@dagrejs/dagre";
import type { LifeMapEdge, LifeMapNode } from "./types";
import { CENTER_NODE_ID } from "./hubs";

const NODE_WIDTH = 160;
const NODE_HEIGHT = 64;
const CENTER_SIZE = 100;
const HUB_SIZE = 88;

export type LayoutMode = "overview" | "branch" | "full";

export function getNodeDimensions(type: string): { width: number; height: number } {
  if (type === "center") return { width: CENTER_SIZE, height: CENTER_SIZE };
  if (type === "area") return { width: HUB_SIZE, height: HUB_SIZE };
  return { width: NODE_WIDTH, height: NODE_HEIGHT };
}

/** Fast radial layout for overview (no dagre) */
function layoutOverview(nodes: LifeMapNode[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  positions.set(CENTER_NODE_ID, { x: 0, y: 0 });

  const hubs = nodes.filter((n) => n.type === "area");
  const radius = 280;
  const step = (2 * Math.PI) / Math.max(hubs.length, 1);

  hubs.forEach((hub, i) => {
    const angle = step * i - Math.PI / 2;
    positions.set(hub.id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  });

  return positions;
}

/** Single dagre tree for branch view */
function layoutBranch(nodes: LifeMapNode[], edges: LifeMapEdge[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 60 });

  for (const n of nodes) g.setNode(n.id, getNodeDimensions(n.type));
  for (const e of edges) {
    if (nodes.some((n) => n.id === e.from) && nodes.some((n) => n.id === e.to)) {
      g.setEdge(e.from, e.to);
    }
  }

  dagre.layout(g);
  for (const n of nodes) {
    const layout = g.node(n.id);
    if (layout) positions.set(n.id, { x: layout.x, y: layout.y });
  }
  return positions;
}

export function layoutLifeMap(
  nodes: LifeMapNode[],
  edges: LifeMapEdge[],
  mode: LayoutMode = "full"
): Map<string, { x: number; y: number }> {
  if (mode === "overview") return layoutOverview(nodes);
  if (mode === "branch") return layoutBranch(nodes, edges);

  // Full: overview hubs + single dagre per hub (legacy, capped graphs only)
  const positions = layoutOverview(nodes.filter((n) => n.type === "center" || n.type === "area"));
  const hubs = nodes.filter((n) => n.type === "area");

  for (const hub of hubs) {
    const childIds = new Set<string>();
    for (const e of edges) {
      if (e.from === hub.id) childIds.add(e.to);
    }
    const children = nodes.filter((n) => childIds.has(n.id)).slice(0, 12);
    if (!children.length) continue;

    const sub = layoutBranch([hub, ...children], edges);
    const hubPos = positions.get(hub.id) ?? { x: 0, y: 0 };
    const hubLayout = sub.get(hub.id) ?? { x: 0, y: 0 };
    const ox = hubPos.x - hubLayout.x;
    const oy = hubPos.y - hubLayout.y + 70;

    for (const c of children) {
      const p = sub.get(c.id);
      if (p) positions.set(c.id, { x: p.x + ox, y: p.y + oy });
    }
  }

  for (const n of nodes) {
    if (!positions.has(n.id)) positions.set(n.id, { x: 0, y: 600 });
  }

  return positions;
}
