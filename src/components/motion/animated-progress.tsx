"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface AnimatedProgressProps {
  value: number;
  color?: string;
  className?: string;
  height?: string;
  showLabel?: boolean;
}

export function AnimatedProgress({
  value,
  color = "var(--gold)",
  className = "",
  height = "h-1.5",
  showLabel = false,
}: AnimatedProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const spring = useSpring(0, { stiffness: 120, damping: 20, mass: 0.4 });
  const width = useTransform(spring, (v) => `${v}%`);

  useEffect(() => {
    spring.set(clamped);
  }, [clamped, spring]);

  return (
    <div className={cn(`${height} bg-surface3 rounded-full overflow-hidden relative`, className)}>
      <motion.div
        className="h-full rounded-full origin-right"
        style={{ width, background: color }}
        transition={{ duration: MOTION.duration.slow, ease: MOTION.ease.out }}
      />
      {showLabel && (
        <motion.span
          key={clamped}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-text3"
        >
          {Math.round(clamped)}%
        </motion.span>
      )}
    </div>
  );
}
