"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import type { JournalGraphEdge, JournalGraphNode } from "@/types/journal";

const TYPE_COLORS: Record<string, string> = {
  note: "#d4a853",
  goal: "#2dd4bf",
  project: "#38bdf8",
  task: "#a78bfa",
  book: "#f472b6",
  habit: "#4ade80",
  area: "#fb923c",
};

function GraphNode({ data }: { data: JournalGraphNode }) {
  const color = TYPE_COLORS[data.type] ?? "#888";
  return (
    <div
      className="px-3 py-2 rounded-xl border-2 bg-surface/90 backdrop-blur-sm shadow-premium min-w-[120px] max-w-[180px] transition-transform hover:scale-105"
      style={{ borderColor: color }}
    >
      <div className="text-[9px] font-mono uppercase" style={{ color }}>
        {data.type}
      </div>
      <div className="text-xs font-bold truncate">{data.label}</div>
    </div>
  );
}

const nodeTypes = { journal: GraphNode };

function GraphInner() {
  const [nodes, setNodes] = useState<JournalGraphNode[]>([]);
  const [edges, setEdges] = useState<JournalGraphEdge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/journal/graph")
      .then((r) => r.json())
      .then((json) => {
        setNodes(json.nodes ?? []);
        setEdges(json.edges ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const { flowNodes, flowEdges } = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(nodes.length || 1));
    const flowNodes: Node[] = nodes.map((n, i) => ({
      id: n.id,
      type: "journal",
      position: { x: (i % cols) * 200, y: Math.floor(i / cols) * 100 },
      data: n as unknown as Record<string, unknown>,
      draggable: true,
    }));
    const flowEdges: Edge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: "var(--gold)", strokeWidth: 1.5 },
    }));
    return { flowNodes, flowEdges };
  }, [nodes, edges]);

  if (loading) return <div className="h-[70vh] skeleton-shimmer rounded-2xl" />;

  return (
    <div className="h-[70vh] rounded-2xl border border-border2 overflow-hidden glass-premium">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        onNodeClick={(_, node) => {
          const d = node.data as unknown as JournalGraphNode;
          if (d.href) window.location.href = d.href;
        }}
      >
        <Background gap={20} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export function JournalGraphView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-gold2">🕸️ Knowledge Graph</h1>
          <p className="text-sm text-text3">ملاحظات · أهداف · مهام · كتب · عادات</p>
        </div>
        <Link href="/journal">
          <Button variant="ghost" size="sm">← Journal</Button>
        </Link>
      </div>
      <ReactFlowProvider>
        <GraphInner />
      </ReactFlowProvider>
    </div>
  );
}
