"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { LifeMapNode as LifeMapNodeData } from "@/lib/life-map/types";
import { cn } from "@/lib/utils";

export type LifeMapFlowNodeData = LifeMapNodeData & {
  selected?: boolean;
  childCount?: number;
};

function LifeMapNodeComponent({ data }: NodeProps) {
  const d = data as unknown as LifeMapFlowNodeData;
  const isCenter = d.type === "center";
  const isHub = d.type === "area";
  const color = d.color ?? "var(--gold)";
  const atRisk = d.status === "at_risk";

  return (
    <div
      className={cn(
        "relative rounded-2xl liquid-glass glass-blur-md glass-reflect transition-all duration-300",
        isCenter && "rounded-full flex items-center justify-center text-center",
        isHub && "min-w-[92px] cursor-pointer hover:scale-[1.04] glass-lift",
        !isCenter && !isHub && "min-w-[130px] max-w-[180px] hover:scale-[1.02]",
        d.selected && "ring-2 ring-gold/70 scale-[1.03] glass-inner-glow",
        atRisk && "glass-glow-critical"
      )}
      style={{
        borderColor: `${color}55`,
        background: isCenter
          ? `radial-gradient(circle at 35% 25%, color-mix(in srgb, ${color} 28%, transparent), color-mix(in srgb, var(--surface) 75%, transparent))`
          : `linear-gradient(145deg, color-mix(in srgb, ${color} 14%, var(--surface)) 0%, color-mix(in srgb, var(--surface2) 65%, transparent) 100%)`,
        boxShadow: d.selected
          ? `0 0 32px color-mix(in srgb, ${color} 35%, transparent), 0 12px 36px color-mix(in srgb, var(--bg) 40%, transparent)`
          : `0 0 16px color-mix(in srgb, ${color} 12%, transparent), 0 4px 20px color-mix(in srgb, var(--bg) 35%, transparent)`,
        width: isCenter ? 108 : undefined,
        height: isCenter ? 108 : undefined,
        padding: isCenter ? 0 : isHub ? "12px 14px" : "10px 12px",
      }}
    >
      <div className="glass-edge" aria-hidden />
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" />

      {isCenter ? (
        <div className="relative z-[1]">
          <div className="text-2xl drop-shadow-sm">{d.icon ?? "✦"}</div>
          <div className="font-display font-black text-xs tracking-widest text-gold2 mt-0.5">{d.label}</div>
        </div>
      ) : (
        <div className="text-right relative z-[1]">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-base">{d.icon ?? "•"}</span>
            <span className={cn("font-bold truncate", isHub ? "text-[10px] tracking-wider" : "text-xs")}>
              {d.label}
            </span>
          </div>
          {isHub && d.healthScore != null && (
            <div className="text-[10px] font-mono font-bold mt-1" style={{ color }}>
              {d.healthScore}%
            </div>
          )}
          {isHub && d.description && (
            <div className="text-[9px] text-text3 mt-0.5">{d.description}</div>
          )}
          {!isHub && d.progress != null && (
            <div className="text-[9px] font-mono mt-0.5 text-text3">{d.progress}%</div>
          )}
        </div>
      )}
    </div>
  );
}

export const LifeMapFlowNode = memo(LifeMapNodeComponent);
