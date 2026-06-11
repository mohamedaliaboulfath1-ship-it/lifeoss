"use client";

import { motion } from "framer-motion";
import { cardEnter, cardHover } from "@/lib/motion/card";
import { cn } from "@/lib/utils";

type SurfaceVariant =
  | "glass"
  | "elevated"
  | "gradient-indigo"
  | "gradient-emerald"
  | "gradient-blue"
  | "gradient-rose"
  | "gradient-cyan"
  | "gradient-purple"
  | "gradient-premium-slate"
  | "area-body"
  | "area-career"
  | "area-finance"
  | "area-learning";

const VARIANT: Record<SurfaceVariant, string> = {
  glass: "glass-premium shadow-premium layered-card",
  elevated: "surface-elevated shadow-premium-lg surface-l2",
  "gradient-indigo": "gradient-indigo floating-panel layered-card surface-l2",
  "gradient-emerald": "gradient-emerald floating-panel layered-card surface-l2",
  "gradient-blue": "gradient-blue floating-panel layered-card surface-l2",
  "gradient-rose": "gradient-rose floating-panel layered-card surface-l2",
  "gradient-cyan": "gradient-cyan floating-panel layered-card surface-l2",
  "gradient-purple": "gradient-purple floating-panel layered-card surface-l2",
  "gradient-premium-slate": "gradient-premium-slate floating-panel layered-card surface-l3",
  "area-body": "area-body floating-panel layered-card surface-l2",
  "area-career": "area-career floating-panel layered-card surface-l2",
  "area-finance": "area-finance floating-panel layered-card surface-l2",
  "area-learning": "area-learning floating-panel layered-card surface-l2",
};

interface PremiumSurfaceProps {
  children: React.ReactNode;
  className?: string;
  variant?: SurfaceVariant;
  interactive?: boolean;
  delay?: number;
}

export function PremiumSurface({
  children,
  className,
  variant = "glass",
  interactive = true,
  delay = 0,
}: PremiumSurfaceProps) {
  return (
    <motion.div
      layout
      initial={cardEnter.initial}
      animate={cardEnter.animate}
      transition={{ ...cardEnter.transition, delay }}
      whileHover={interactive ? cardHover : undefined}
      className={cn(
        "rounded-[10px] border border-border/60",
        VARIANT[variant],
        className
      )}
    >
      {children}
    </motion.div>
  );
}
