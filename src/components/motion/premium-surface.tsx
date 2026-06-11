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
  | "gradient-purple";

const VARIANT: Record<SurfaceVariant, string> = {
  glass: "glass-premium shadow-premium",
  elevated: "surface-elevated shadow-premium-lg",
  "gradient-indigo": "gradient-indigo floating-panel",
  "gradient-emerald": "gradient-emerald floating-panel",
  "gradient-blue": "gradient-blue floating-panel",
  "gradient-rose": "gradient-rose floating-panel",
  "gradient-cyan": "gradient-cyan floating-panel",
  "gradient-purple": "gradient-purple floating-panel",
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
