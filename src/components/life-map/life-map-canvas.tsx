"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LifeMapFlowNode } from "./life-map-node";
import type { LifeMapEdge, LifeMapNode } from "@/lib/life-map/types";
import { layoutLifeMap, getNodeDimensions, type LayoutMode } from "@/lib/life-map/layout";
import { CENTER_NODE_ID } from "@/lib/life-map/hubs";

const nodeTypes = { lifeMap: LifeMapFlowNode } as const;

export interface LifeMapCanvasHandle {
  fitView: () => void;
  resetView: () => void;
}

interface CanvasInnerProps {
  nodes: LifeMapNode[];
  edges: LifeMapEdge[];
  layoutMode: LayoutMode;
  selectedId: string | null;
  focusId: string | null;
  onSelect: (node: LifeMapNode | null) => void;
  onHubOpen?: (hubId: string) => void;
  canvasRef?: React.MutableRefObject<LifeMapCanvasHandle | null>;
}

function CanvasInner({
  nodes,
  edges,
  layoutMode,
  selectedId,
  focusId,
  onSelect,
  onHubOpen,
  canvasRef,
}: CanvasInnerProps) {
  const { fitView, setCenter, getZoom } = useReactFlow();
  const hasFit = useRef(false);

  useEffect(() => {
    if (canvasRef) {
      canvasRef.current = {
        fitView: () => fitView({ padding: 0.2, duration: 400 }),
        resetView: () => fitView({ padding: 0.25, duration: 400 }),
      };
    }
  }, [canvasRef, fitView]);

  const positions = useMemo(
    () => layoutLifeMap(nodes, edges, layoutMode),
    [nodes, edges, layoutMode]
  );

  const { flowNodes, flowEdges } = useMemo(() => {
    const flowNodes: Node[] = nodes.map((n) => {
      const pos = positions.get(n.id) ?? { x: 0, y: 0 };
      const dim = getNodeDimensions(n.type);
      return {
        id: n.id,
        type: "lifeMap",
        position: { x: pos.x - dim.width / 2, y: pos.y - dim.height / 2 },
        data: { ...n, selected: selectedId === n.id },
        draggable: false,
      };
    });

    const flowEdges: Edge[] = edges.map((e, i) => ({
      id: `e-${i}-${e.from}-${e.to}`,
      source: e.from,
      target: e.to,
      type: "smoothstep",
      style: {
        stroke: e.kind === "hub" ? "var(--gold)" : "color-mix(in srgb, var(--sky) 50%, var(--border))",
        strokeWidth: e.kind === "hub" ? 2 : 1,
        opacity: e.kind === "hub" ? 0.7 : 0.35,
      },
      animated: false,
    }));

    return { flowNodes, flowEdges };
  }, [nodes, edges, positions, selectedId]);

  useEffect(() => {
    hasFit.current = false;
  }, [layoutMode, nodes.length]);

  useEffect(() => {
    if (!hasFit.current && flowNodes.length) {
      hasFit.current = true;
      const t = window.setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
      return () => window.clearTimeout(t);
    }
  }, [flowNodes.length, layoutMode, fitView]);

  useEffect(() => {
    if (!focusId) return;
    const node = flowNodes.find((n) => n.id === focusId);
    if (!node) return;
    const raw = nodes.find((n) => n.id === focusId);
    const dim = getNodeDimensions(raw?.type ?? "goal");
    setCenter(node.position.x + dim.width / 2, node.position.y + dim.height / 2, {
      zoom: Math.max(getZoom(), 1.1),
      duration: 400,
    });
  }, [focusId, flowNodes, nodes, setCenter, getZoom]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const raw = nodes.find((n) => n.id === node.id) ?? null;
      if (raw?.type === "area" && layoutMode === "overview" && onHubOpen) {
        onHubOpen(raw.id);
        return;
      }
      onSelect(raw);
    },
    [nodes, onSelect, onHubOpen, layoutMode]
  );

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes as import("@xyflow/react").NodeTypes}
      onNodeClick={onNodeClick}
      fitView
      minZoom={0.4}
      maxZoom={1.8}
      panOnScroll
      panOnDrag
      zoomOnScroll
      zoomOnPinch
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
      className="life-map-flow bg-[var(--bg)]"
      onlyRenderVisibleElements
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="color-mix(in srgb, var(--border) 35%, transparent)" />
      {nodes.length > 15 && (
        <MiniMap
          nodeColor={(n) => (n.id === CENTER_NODE_ID ? "var(--gold)" : "var(--sky)")}
          maskColor="color-mix(in srgb, var(--bg) 80%, transparent)"
          className="!bg-surface/90 !border !border-border/40 !rounded-lg !scale-90"
        />
      )}
      <Controls showInteractive={false} className="!bg-surface/90 !border !border-border/40 !rounded-lg" />
    </ReactFlow>
  );
}

export function LifeMapCanvas(props: CanvasInnerProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
