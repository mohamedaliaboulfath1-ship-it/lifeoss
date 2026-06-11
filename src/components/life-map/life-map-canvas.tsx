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
import { LifeMapFlowEdge } from "./life-map-edge";
import type { LifeMapPayload, LifeMapNode } from "@/lib/life-map/types";
import { layoutLifeMap, getNodeDimensions } from "@/lib/life-map/layout";
import { CENTER_NODE_ID } from "@/lib/life-map/hubs";

const nodeTypes = { lifeMap: LifeMapFlowNode } as const;
const edgeTypes = { lifeMap: LifeMapFlowEdge } as const;

function getConnectedIds(nodeId: string, edges: LifeMapPayload["edges"]): Set<string> {
  const set = new Set<string>([nodeId]);
  for (const e of edges) {
    if (e.from === nodeId) set.add(e.to);
    if (e.to === nodeId) set.add(e.from);
  }
  return set;
}

export interface LifeMapCanvasHandle {
  fitView: () => void;
  resetView: () => void;
}

interface CanvasInnerProps {
  data: LifeMapPayload;
  selectedId: string | null;
  hoveredId: string | null;
  focusId: string | null;
  onSelect: (node: LifeMapNode | null) => void;
  onHover: (id: string | null) => void;
  canvasRef?: React.MutableRefObject<LifeMapCanvasHandle | null>;
}

function CanvasInner({ data, selectedId, hoveredId, focusId, onSelect, onHover, canvasRef }: CanvasInnerProps) {
  const { fitView, setCenter, getZoom } = useReactFlow();
  const hasFit = useRef(false);
  const activeId = focusId ?? hoveredId ?? selectedId;
  const connected = useMemo(
    () => (activeId ? getConnectedIds(activeId, data.edges) : null),
    [activeId, data.edges]
  );

  useEffect(() => {
    if (canvasRef) {
      canvasRef.current = {
        fitView: () => fitView({ padding: 0.15, duration: 500 }),
        resetView: () => setCenter(0, 0, { zoom: 0.8, duration: 500 }),
      };
    }
  }, [canvasRef, fitView, setCenter]);

  const { flowNodes, flowEdges } = useMemo(() => {
    const positions = layoutLifeMap(data.nodes, data.edges);
    const nodes: Node[] = data.nodes.map((n) => {
      const pos = positions.get(n.id) ?? { x: 0, y: 0 };
      const dim = getNodeDimensions(n.type);
      const isActive = activeId === n.id;
      const isConnected = connected?.has(n.id);
      const dimmed = activeId != null && !isConnected;
      const highlighted = isActive || (activeId != null && isConnected && n.id !== activeId);
      return {
        id: n.id,
        type: "lifeMap",
        position: { x: pos.x - dim.width / 2, y: pos.y - dim.height / 2 },
        data: {
          ...n,
          dimmed,
          highlighted,
          selected: selectedId === n.id,
          hovered: hoveredId === n.id,
        },
        draggable: true,
      };
    });

    const edges: Edge[] = data.edges.map((e, i) => {
      const fromNode = data.nodes.find((n) => n.id === e.from);
      const highlighted =
        activeId != null &&
        (e.from === activeId || e.to === activeId || (connected?.has(e.from) && connected?.has(e.to)));
      const dimmed = activeId != null && !highlighted;
      return {
        id: `e-${e.from}-${e.to}-${i}`,
        source: e.from,
        target: e.to,
        type: "lifeMap",
        data: {
          kind: e.kind,
          weight: e.weight,
          highlighted,
          dimmed,
          color: fromNode?.color ?? "var(--gold)",
        },
        animated: highlighted,
      };
    });

    return { flowNodes: nodes, flowEdges: edges };
  }, [data, activeId, connected, selectedId, hoveredId]);

  useEffect(() => {
    if (!hasFit.current && flowNodes.length) {
      hasFit.current = true;
      window.setTimeout(() => fitView({ padding: 0.15, duration: 600 }), 80);
    }
  }, [flowNodes.length, fitView]);

  useEffect(() => {
    if (!focusId) return;
    const node = flowNodes.find((n) => n.id === focusId);
    if (!node) return;
    const raw = data.nodes.find((n) => n.id === focusId);
    const dim = getNodeDimensions(raw?.type ?? "goal");
    const cx = node.position.x + dim.width / 2;
    const cy = node.position.y + dim.height / 2;
    setCenter(cx, cy, { zoom: Math.max(getZoom(), 1.2), duration: 500 });
  }, [focusId, flowNodes, setCenter, getZoom]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const raw = data.nodes.find((n) => n.id === node.id) ?? null;
      onSelect(raw);
    },
    [data.nodes, onSelect]
  );

  const onNodeMouseEnter: NodeMouseHandler = useCallback((_, node) => onHover(node.id), [onHover]);
  const onNodeMouseLeave: NodeMouseHandler = useCallback(() => onHover(null), [onHover]);

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes as import("@xyflow/react").NodeTypes}
      edgeTypes={edgeTypes as import("@xyflow/react").EdgeTypes}
      onNodeClick={onNodeClick}
      onNodeMouseEnter={onNodeMouseEnter}
      onNodeMouseLeave={onNodeMouseLeave}
      fitView
      minZoom={0.15}
      maxZoom={2.5}
      panOnScroll
      panOnDrag
      zoomOnScroll
      zoomOnPinch
      selectionOnDrag={false}
      proOptions={{ hideAttribution: true }}
      className="life-map-flow bg-[var(--bg)]"
      onlyRenderVisibleElements
      defaultEdgeOptions={{ type: "lifeMap" }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="color-mix(in srgb, var(--border) 50%, transparent)" />
      <MiniMap
        nodeColor={(n) => (n.id === CENTER_NODE_ID ? "var(--gold)" : "var(--sky)")}
        maskColor="color-mix(in srgb, var(--bg) 75%, transparent)"
        className="!bg-surface/90 !border !border-border/50 !rounded-xl"
        pannable
        zoomable
      />
      <Controls
        showInteractive={false}
        className="!bg-surface/90 !border !border-border/50 !rounded-xl !shadow-premium"
      />
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
