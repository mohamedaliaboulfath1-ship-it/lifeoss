"use client";

import { AnimatedProgress } from "@/components/motion/animated-progress";

interface ProgressBarProps {
  value: number;
  color?: string;
  className?: string;
}

export function ProgressBar({
  value,
  color = "var(--gold)",
  className = "",
}: ProgressBarProps) {
  return (
    <AnimatedProgress value={value} color={color} className={className} />
  );
}
