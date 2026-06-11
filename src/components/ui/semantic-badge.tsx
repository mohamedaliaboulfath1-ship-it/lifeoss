"use client";

import { motion } from "framer-motion";
import type { SemanticState } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

const CONFIG: Record<SemanticState, { label: string; className: string }> = {
  default: { label: "", className: "badge-default" },
  success: { label: "✓", className: "badge-success" },
  warning: { label: "!", className: "badge-warning" },
  critical: { label: "‼", className: "badge-critical" },
  growth: { label: "↑", className: "badge-growth" },
};

export function SemanticBadge({
  state,
  text,
  className,
}: {
  state: SemanticState;
  text?: string;
  className?: string;
}) {
  if (state === "default" && !text) return null;
  const cfg = CONFIG[state];

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
        cfg.className,
        className
      )}
    >
      {text ?? cfg.label}
    </motion.span>
  );
}
