"use client";

import { motion } from "framer-motion";
import { cardHover, cardTap } from "@/lib/motion/card";
import { motionV2 } from "@/lib/motion/presets-v2";
import type { SemanticState, SurfaceLevel } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

interface LayeredCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  state?: SemanticState;
  level?: SurfaceLevel;
  interactive?: boolean;
  delay?: number;
  glow?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const STATE_CLASS: Record<SemanticState, string> = {
  default: "",
  success: "state-success",
  warning: "state-warning",
  critical: "state-critical",
  growth: "state-growth",
};

const LEVEL_CLASS: Record<SurfaceLevel, string> = {
  1: "surface-l1",
  2: "surface-l2",
  3: "surface-l3",
  4: "surface-l4",
};

export function LayeredCard({
  children,
  className,
  gradient = "gradient-premium-slate",
  state = "default",
  level = 2,
  interactive = true,
  delay = 0,
  glow = true,
  onClick,
  style,
}: LayeredCardProps) {
  const entrance = motionV2.cardEntrance(delay);

  return (
    <motion.div
      {...entrance}
      whileHover={interactive ? cardHover : undefined}
      whileTap={interactive ? cardTap : undefined}
      onClick={onClick}
      style={style}
      className={cn(
        "layered-card relative rounded-2xl border overflow-hidden",
        LEVEL_CLASS[level],
        gradient,
        STATE_CLASS[state],
        interactive && "cursor-pointer",
        className
      )}
    >
      {glow && <div className="layered-card-glow" aria-hidden />}
      <div className="layered-card-accent" aria-hidden />
      <div className="layered-card-content relative z-10">{children}</div>
    </motion.div>
  );
}
