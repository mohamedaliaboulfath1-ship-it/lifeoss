"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import type { LifeMapNode as LifeMapNodeData } from "@/lib/life-map/types";
import { cn } from "@/lib/utils";

export type LifeMapFlowNodeData = LifeMapNodeData & {
  dimmed?: boolean;
  highlighted?: boolean;
  selected?: boolean;
  hovered?: boolean;
};

function ProgressRing({ value, color, size = 36 }: { value: number; color: string; size?: number }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="color-mix(in srgb, var(--border) 80%, transparent)" strokeWidth={3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

function LifeMapNodeComponent({ data }: NodeProps) {
  const d = data as unknown as LifeMapFlowNodeData;
  const isCenter = d.type === "center";
  const isHub = d.type === "area";
  const color = d.color ?? "var(--gold)";
  const atRisk = d.status === "at_risk";
  const completed = d.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={{
        opacity: d.dimmed ? 0.22 : 1,
        scale: d.highlighted || d.selected ? 1.04 : d.hovered ? 1.02 : 1,
        y: d.hovered || d.selected ? -4 : 0,
      }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={cn(
        "relative rounded-2xl border backdrop-blur-md transition-shadow duration-300",
        isCenter && "rounded-full flex items-center justify-center text-center shadow-premium-lg",
        isHub && "rounded-2xl min-w-[100px]",
        !isCenter && !isHub && "min-w-[140px] max-w-[200px]",
        d.highlighted && "ring-2 ring-offset-2 ring-offset-[var(--bg)] ring-gold/50",
        d.selected && "ring-2 ring-gold/60",
        atRisk && "border-rose/50",
        completed && "border-emerald/40"
      )}
      style={{
        borderColor: d.dimmed ? "var(--border)" : `${color}55`,
        background: isCenter
          ? `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${color} 35%, var(--surface)), var(--surface))`
          : `linear-gradient(145deg, color-mix(in srgb, ${color} 14%, var(--surface)), color-mix(in srgb, ${color} 6%, var(--surface2)))`,
        boxShadow: d.highlighted || d.hovered || d.selected
          ? `0 12px 40px color-mix(in srgb, ${color} 25%, transparent), 0 0 24px color-mix(in srgb, ${color} 15%, transparent)`
          : "0 4px 20px color-mix(in srgb, var(--bg) 40%, transparent)",
        width: isCenter ? 120 : undefined,
        height: isCenter ? 120 : undefined,
        padding: isCenter ? 0 : isHub ? "14px 16px" : "12px 14px",
      }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-transparent !border-0" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-transparent !border-0" />

      {isCenter ? (
        <div>
          <div className="text-2xl mb-0.5">{d.icon ?? "✦"}</div>
          <div className="font-display font-black text-sm tracking-widest text-gold2">{d.label}</div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          {d.progress != null && !isHub ? (
            <ProgressRing value={d.progress} color={color} size={32} />
          ) : (
            <span className="text-lg shrink-0">{d.icon ?? "•"}</span>
          )}
          <div className="flex-1 min-w-0 text-right">
            <div className={cn("font-bold truncate", isHub ? "text-xs tracking-wider" : "text-xs")}>{d.label}</div>
            {!isHub && d.type !== "area" && (
              <div className="text-[9px] text-text3 uppercase tracking-wide mt-0.5">{d.type}</div>
            )}
            {isHub && d.healthScore != null && (
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] font-mono font-bold" style={{ color }}>
                  {d.healthScore}%
                </span>
                {d.trend === "up" && <span className="text-[9px] text-emerald">↑</span>}
                {d.trend === "down" && <span className="text-[9px] text-rose">↓</span>}
              </div>
            )}
            {!isHub && d.progress != null && (
              <div className="text-[9px] font-mono mt-0.5" style={{ color }}>{d.progress}%</div>
            )}
            {atRisk && <div className="text-[8px] text-rose2 mt-0.5">⚠ at risk</div>}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export const LifeMapFlowNode = memo(LifeMapNodeComponent);
