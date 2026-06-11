import dagre from "@dagrejs/dagre";
import type { LifeMapEdge, LifeMapNode } from "./types";
import { CENTER_NODE_ID } from "./hubs";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 72;
const CENTER_SIZE = 120;
const HUB_SIZE = 100;

export function getNodeDimensions(type: string): { width: number; height: number } {
  if (type === "center") return { width: CENTER_SIZE, height: CENTER_SIZE };
  if (type === "area") return { width: HUB_SIZE, height: HUB_SIZE };
  return { width: NODE_WIDTH, height: NODE_HEIGHT };
}

/** Radial mind-map layout: center → hubs on ring → children via dagre subgraphs */
export function layoutLifeMap(
  nodes: LifeMapNode[],
  edges: LifeMapEdge[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const center = nodes.find((n) => n.id === CENTER_NODE_ID);
  if (!center) return positions;

  positions.set(CENTER_NODE_ID, { x: 0, y: 0 });

  const hubs = nodes.filter((n) => n.type === "area");
  const hubRadius = 520;
  const hubAngleStep = (2 * Math.PI) / Math.max(hubs.length, 1);

  hubs.forEach((hub, i) => {
    const angle = hubAngleStep * i - Math.PI / 2;
    positions.set(hub.id, {
      x: Math.cos(angle) * hubRadius,
      y: Math.sin(angle) * hubRadius,
    });
  });

  // Per-hub dagre layout for descendants
  for (const hub of hubs) {
    const hubPos = positions.get(hub.id)!;
    const childIds = new Set<string>();
    const queue = [hub.id];
    const visited = new Set<string>([CENTER_NODE_ID]);

    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id) && id !== hub.id) continue;
      visited.add(id);
      for (const e of edges) {
        if (e.from === id && e.to !== CENTER_NODE_ID && !hubs.some((h) => h.id === e.to)) {
          if (!childIds.has(e.to)) {
            childIds.add(e.to);
            queue.push(e.to);
          }
        }
      }
    }

    const childNodes = nodes.filter((n) => childIds.has(n.id));
    if (!childNodes.length) continue;

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 70, marginx: 20, marginy: 20 });

    g.setNode(hub.id, getNodeDimensions(hub.type));
    for (const n of childNodes) {
      g.setNode(n.id, getNodeDimensions(n.type));
    }

    for (const e of edges) {
      if (childIds.has(e.to) && (e.from === hub.id || childIds.has(e.from))) {
        g.setEdge(e.from, e.to);
      }
    }

    dagre.layout(g);

    const hubLayout = g.node(hub.id);
    const offsetX = hubPos.x - (hubLayout?.x ?? 0);
    const offsetY = hubPos.y - (hubLayout?.y ?? 0) + 80;

    for (const n of childNodes) {
      const layout = g.node(n.id);
      if (layout) {
        positions.set(n.id, { x: layout.x + offsetX, y: layout.y + offsetY });
      }
    }
  }

  // Fallback: dagre full graph for orphans
  const placed = new Set(positions.keys());
  const orphans = nodes.filter((n) => !placed.has(n.id));
  if (orphans.length) {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 100 });
    for (const n of nodes) g.setNode(n.id, getNodeDimensions(n.type));
    for (const e of edges) g.setEdge(e.from, e.to);
    dagre.layout(g);
    for (const n of orphans) {
      const layout = g.node(n.id);
      if (layout) positions.set(n.id, { x: layout.x, y: layout.y + 900 });
    }
  }

  return positions;
}
