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
        "relative rounded-2xl border backdrop-blur-sm transition-all duration-200",
        isCenter && "rounded-full flex items-center justify-center text-center",
        isHub && "min-w-[88px] cursor-pointer hover:scale-[1.03]",
        !isCenter && !isHub && "min-w-[130px] max-w-[180px]",
        d.selected && "ring-2 ring-gold/60 scale-[1.02]",
        atRisk && "border-rose/50"
      )}
      style={{
        borderColor: `${color}44`,
        background: isCenter
          ? `radial-gradient(circle, color-mix(in srgb, ${color} 20%, var(--surface)), var(--surface))`
          : `linear-gradient(145deg, color-mix(in srgb, ${color} 10%, var(--surface)), var(--surface2))`,
        boxShadow: d.selected
          ? `0 8px 24px color-mix(in srgb, ${color} 20%, transparent)`
          : "0 2px 12px color-mix(in srgb, var(--bg) 30%, transparent)",
        width: isCenter ? 100 : undefined,
        height: isCenter ? 100 : undefined,
        padding: isCenter ? 0 : isHub ? "12px 14px" : "10px 12px",
      }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" />

      {isCenter ? (
        <div>
          <div className="text-xl">{d.icon ?? "✦"}</div>
          <div className="font-display font-black text-xs tracking-widest text-gold2">{d.label}</div>
        </div>
      ) : (
        <div className="text-right">
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
