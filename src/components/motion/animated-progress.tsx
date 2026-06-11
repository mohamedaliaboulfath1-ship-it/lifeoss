"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { useInViewEnter } from "@/hooks/use-in-view-enter";
import { cn } from "@/lib/utils";

interface AnimatedProgressProps {
  value: number;
  color?: string;
  className?: string;
  height?: string;
  showLabel?: boolean;
  playOnView?: boolean;
  playKey?: number;
}

export function AnimatedProgress({
  value,
  color = "var(--gold)",
  className = "",
  height = "h-1.5",
  showLabel = false,
  playOnView = true,
  playKey,
}: AnimatedProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const inView = useInViewEnter(0.08);
  const effectiveKey = playKey ?? (playOnView ? inView.enterCount : 1);

  const spring = useSpring(0, { stiffness: 120, damping: 20, mass: 0.4 });
  const width = useTransform(spring, (v) => `${v}%`);

  useEffect(() => {
    if (effectiveKey === 0) {
      spring.jump(clamped);
      return;
    }
    spring.jump(0);
    const id = requestAnimationFrame(() => spring.set(clamped));
    return () => cancelAnimationFrame(id);
  }, [effectiveKey, clamped, spring]);

  return (
    <div
      ref={playOnView && playKey == null ? inView.ref : undefined}
      className={cn(`${height} bg-surface3 rounded-full overflow-hidden relative`, className)}
    >
      <motion.div
        className="h-full rounded-full origin-right progress-glow-bar"
        style={{ width, ["--progress-color" as string]: color }}
      />
      {showLabel && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-text3">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
