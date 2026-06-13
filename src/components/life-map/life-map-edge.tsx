"use client";

import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export type LifeMapEdgeData = {
  kind?: string;
  weight?: number;
  highlighted?: boolean;
  dimmed?: boolean;
  color?: string;
};

function LifeMapEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps) {
  const d = (data ?? {}) as LifeMapEdgeData;
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const weight = d.weight ?? 1;
  const strokeWidth = Math.min(4, 1 + weight * 0.8);
  const color = d.color ?? "var(--gold)";
  const opacity = d.dimmed ? 0.06 : d.highlighted ? 1 : 0.55;
  const glow = d.highlighted
    ? `drop-shadow(0 0 8px color-mix(in srgb, ${color} 70%, transparent)) drop-shadow(0 0 16px color-mix(in srgb, var(--sky) 40%, transparent))`
    : `drop-shadow(0 0 4px color-mix(in srgb, ${color} 25%, transparent))`;

  return (
    <>
      <defs>
        <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity={d.highlighted ? 0.9 : 0.35} />
          <stop offset="100%" stopColor="var(--sky)" stopOpacity={d.highlighted ? 0.7 : 0.2} />
        </linearGradient>
      </defs>
      <BaseEdge
        id={id}
        path={path}
        style={{
          ...style,
          stroke: `url(#grad-${id})`,
          strokeWidth,
          opacity,
          filter: glow,
          strokeDasharray: d.kind === "hub" ? undefined : d.highlighted ? undefined : "8 5",
          animation: d.highlighted ? "life-map-flow 1s linear infinite" : d.dimmed ? undefined : "life-map-flow 3s linear infinite",
        }}
        className="life-map-edge"
      />
      {d.highlighted && (
        <circle r={3} fill={color} opacity={0.9}>
          <animateMotion dur="2s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </>
  );
}

export const LifeMapFlowEdge = memo(LifeMapEdgeComponent);
