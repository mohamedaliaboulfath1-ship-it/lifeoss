import type { AreaPreview } from "@/types/areas";
import type { KnowledgeGraphEdge, KnowledgeGraphNode } from "@/types/areas";

export type ParaNodeType =
  | "root"
  | "area"
  | "goals"
  | "projects"
  | "tasks"
  | "habits"
  | "resources";

export interface ParaFlowNode {
  id: string;
  type: ParaNodeType;
  label: string;
  icon?: string;
  color?: string;
  count?: number;
  slug?: string;
}

export interface ParaFlowEdge {
  from: string;
  to: string;
}

/** Overview PARA map — areas connected to PARA layers */
export function buildOverviewParaGraph(previews: AreaPreview[]): {
  nodes: ParaFlowNode[];
  edges: ParaFlowEdge[];
} {
  const nodes: ParaFlowNode[] = [
    { id: "para-root", type: "root", label: "PARA", icon: "✦" },
  ];
  const edges: ParaFlowEdge[] = [];

  const layers: { id: string; label: string; icon: string; key: keyof AreaPreview }[] = [
    { id: "layer-goals", label: "Goals", icon: "🎯", key: "activeGoals" },
    { id: "layer-projects", label: "Projects", icon: "📁", key: "projects" },
    { id: "layer-tasks", label: "Tasks", icon: "📋", key: "tasks" },
    { id: "layer-habits", label: "Habits", icon: "🔄", key: "habits" },
    { id: "layer-resources", label: "Resources", icon: "📚", key: "books" },
  ];

  for (const p of previews) {
    nodes.push({
      id: `area-${p.slug}`,
      type: "area",
      label: p.nameAr,
      icon: p.icon,
      color: p.color,
      count: p.healthScore,
      slug: p.slug,
    });
    edges.push({ from: "para-root", to: `area-${p.slug}` });
  }

  for (const layer of layers) {
    const total = previews.reduce((s, p) => s + (Number(p[layer.key]) || 0), 0);
    nodes.push({
      id: layer.id,
      type: layer.id.replace("layer-", "") as ParaNodeType,
      label: layer.label,
      icon: layer.icon,
      count: total,
    });
    edges.push({ from: "para-root", to: layer.id });
    for (const p of previews) {
      const count = Number(p[layer.key]) || 0;
      if (count > 0) {
        edges.push({ from: `area-${p.slug}`, to: layer.id });
      }
    }
  }

  return { nodes, edges };
}

/** Area-scoped PARA graph from hub knowledge graph */
export function buildAreaParaGraph(
  areaLabel: string,
  areaIcon: string,
  areaColor: string,
  graph: { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] }
): { nodes: ParaFlowNode[]; edges: ParaFlowEdge[] } {
  const nodes: ParaFlowNode[] = [
    {
      id: "area-root",
      type: "area",
      label: areaLabel,
      icon: areaIcon,
      color: areaColor,
    },
  ];
  const edges: ParaFlowEdge[] = [];

  const typeLayers: Record<string, string> = {
    goal: "layer-goals",
    project: "layer-projects",
    task: "layer-tasks",
    habit: "layer-habits",
    book: "layer-resources",
    course: "layer-resources",
    cert: "layer-resources",
    skill: "layer-resources",
  };

  const layerIds = new Set<string>();

  const labels: Record<string, string> = {
    "layer-goals": "Goals",
    "layer-projects": "Projects",
    "layer-tasks": "Tasks",
    "layer-habits": "Habits",
    "layer-resources": "Resources",
  };

  const nodeTypeMap: Record<string, ParaNodeType> = {
    goal: "goals",
    project: "projects",
    task: "tasks",
    habit: "habits",
    book: "resources",
    course: "resources",
    cert: "resources",
    skill: "resources",
  };

  const edgeSet = new Set<string>();

  function addEdge(from: string, to: string) {
    const key = `${from}->${to}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({ from, to });
    }
  }

  for (const n of graph.nodes) {
    const layerId = typeLayers[n.type];
    if (layerId && !layerIds.has(layerId)) {
      layerIds.add(layerId);
      nodes.push({
        id: layerId,
        type: layerId.replace("layer-", "") as ParaNodeType,
        label: labels[layerId],
      });
      addEdge("area-root", layerId);
    }

    if (!nodes.some((x) => x.id === n.id)) {
      nodes.push({
        id: n.id,
        type: nodeTypeMap[n.type] ?? "resources",
        label: n.label,
        count: n.progress,
      });
    }

    if (layerId) addEdge(layerId, n.id);
  }

  for (const e of graph.edges) {
    addEdge(e.from, e.to);
  }

  if (graph.nodes.length === 0) {
    for (const layerId of Object.values(typeLayers)) {
      if (layerIds.has(layerId)) continue;
      nodes.push({
        id: layerId,
        type: layerId.replace("layer-", "") as ParaNodeType,
        label: labels[layerId],
      });
      addEdge("area-root", layerId);
    }
  }

  return { nodes, edges };
}
