"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type TrendDirection = "up" | "down" | "stable";

interface TrendArrowProps {
  direction: TrendDirection;
  value?: number | string;
  unit?: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const COLORS: Record<TrendDirection, string> = {
  up: "text-emerald2",
  down: "text-rose2",
  stable: "text-text3",
};

const BG: Record<TrendDirection, string> = {
  up: "bg-emerald/15 border-emerald/25",
  down: "bg-rose/15 border-rose/25",
  stable: "bg-surface2 border-border",
};

export function TrendArrow({
  direction,
  value,
  unit = "",
  label,
  size = "md",
  className,
}: TrendArrowProps) {
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.out }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
        BG[direction],
        className
      )}
    >
      <motion.span
        key={direction}
        initial={{ scale: 0.8, rotate: direction === "down" ? -8 : 8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={MOTION.spring.snappy}
      >
        <Icon className={cn(COLORS[direction])} size={iconSize} strokeWidth={2.5} />
      </motion.span>
      {value != null && (
        <span className={cn("font-mono font-bold", COLORS[direction], size === "sm" ? "text-xs" : "text-sm")}>
          {typeof value === "number" && value > 0 && direction === "up" ? "+" : ""}
          {value}
          {unit}
        </span>
      )}
      {label && <span className="text-[10px] text-text3">{label}</span>}
    </motion.div>
  );
}

export function calcWeightTrend(
  logs: { weight: number }[],
  weeklyTarget?: number
): { direction: TrendDirection; weeklyRate: number | null } {
  if (logs.length < 2) return { direction: "stable", weeklyRate: null };
  const recent = logs.slice(-4);
  const delta = recent[recent.length - 1].weight - recent[0].weight;
  const weeks = Math.max(1, recent.length - 1);
  const weeklyRate = Math.round((delta / weeks) * 10) / 10;
  if (Math.abs(weeklyRate) < 0.05) return { direction: "stable", weeklyRate };
  const target = weeklyTarget ?? 0.5;
  if (weeklyRate >= target * 0.5) return { direction: "up", weeklyRate };
  if (weeklyRate < 0) return { direction: "down", weeklyRate };
  return { direction: "stable", weeklyRate };
}
