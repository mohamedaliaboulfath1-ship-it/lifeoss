"use client";

import { memo, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import type { ParaFlowEdge, ParaFlowNode } from "@/lib/areas/para-graph";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  root: "var(--gold)",
  area: "var(--sky)",
  goals: "var(--gold)",
  projects: "var(--purple)",
  tasks: "var(--amber2)",
  habits: "var(--emerald)",
  resources: "var(--teal)",
};

function layoutGraph(
  nodes: ParaFlowNode[],
  edges: ParaFlowEdge[],
  direction: "TB" | "LR" = "TB"
): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 48, ranksep: 64, marginx: 24, marginy: 24 });

  for (const n of nodes) {
    const w = n.type === "root" ? 100 : n.type === "area" ? 120 : 110;
    const h = n.type === "root" ? 56 : 52;
    g.setNode(n.id, { width: w, height: h });
  }
  for (const e of edges) {
    if (g.hasNode(e.from) && g.hasNode(e.to)) g.setEdge(e.from, e.to);
  }

  dagre.layout(g);
  const positions = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const pos = g.node(n.id);
    if (pos) positions.set(n.id, { x: pos.x, y: pos.y });
  }
  return positions;
}

const ParaNode = memo(function ParaNode({ data }: NodeProps) {
  const d = data as unknown as ParaFlowNode & { selected?: boolean };
  const color = d.color ?? TYPE_COLORS[d.type] ?? "var(--border)";
  const isRoot = d.type === "root";

  return (
    <div
      className={cn(
        "relative rounded-xl border backdrop-blur-md transition-all duration-200 text-right px-3 py-2",
        isRoot && "rounded-full text-center min-w-[90px]",
        d.selected && "ring-2 ring-gold/50 scale-[1.02]"
      )}
      style={{
        borderColor: `${color}55`,
        background: `linear-gradient(145deg, color-mix(in srgb, ${color} 12%, var(--surface)), var(--surface2))`,
        boxShadow: `0 4px 16px color-mix(in srgb, ${color} 15%, transparent)`,
        minWidth: isRoot ? 90 : 100,
      }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" />
      <div className="flex items-center justify-end gap-1.5">
        {d.icon && <span className="text-sm">{d.icon}</span>}
        <span className={cn("font-bold truncate", isRoot ? "text-[10px] tracking-widest" : "text-[11px]")}>
          {d.label}
        </span>
      </div>
      {d.count != null && (
        <div className="text-[10px] font-mono font-bold mt-0.5" style={{ color }}>
          {d.type === "area" ? `${d.count}%` : d.count}
        </div>
      )}
    </div>
  );
});

const nodeTypes = { para: ParaNode } as const;

interface FlowInnerProps {
  nodes: ParaFlowNode[];
  edges: ParaFlowEdge[];
  height?: number;
}

function FlowInner({ nodes, edges, height = 380 }: FlowInnerProps) {
  const { flowNodes, flowEdges } = useMemo(() => {
    const positions = layoutGraph(nodes, edges);
    const flowNodes: Node[] = nodes.map((n) => {
      const pos = positions.get(n.id) ?? { x: 0, y: 0 };
      const w = n.type === "root" ? 100 : 120;
      const h = n.type === "root" ? 56 : 52;
      return {
        id: n.id,
        type: "para",
        position: { x: pos.x - w / 2, y: pos.y - h / 2 },
        data: { ...n },
        draggable: false,
      };
    });
    const flowEdges: Edge[] = edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.from,
      target: e.to,
      type: "smoothstep",
      animated: true,
      style: {
        stroke: "color-mix(in srgb, var(--gold) 40%, var(--sky))",
        strokeWidth: 1.5,
        opacity: 0.5,
      },
    }));
    return { flowNodes, flowEdges };
  }, [nodes, edges]);

  if (!nodes.length) {
    return <p className="text-text3 text-sm text-center py-8">أضف بيانات لرؤية خريطة PARA</p>;
  }

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-border/40 bg-surface/30">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        minZoom={0.4}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
      </ReactFlow>
    </div>
  );
}

export function AreaParaFlow(props: FlowInnerProps) {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
}
