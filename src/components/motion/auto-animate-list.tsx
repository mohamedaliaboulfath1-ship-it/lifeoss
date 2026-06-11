"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn } from "@/lib/utils";

interface AutoAnimateListProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

/** Smooth list reorder/add/remove — complements Framer Motion for DOM lists */
export function AutoAnimateList({
  children,
  className,
  duration = 280,
}: AutoAnimateListProps) {
  const [parent] = useAutoAnimate({
    duration,
    easing: "ease-out",
  });

  return (
    <div ref={parent} className={cn(className)}>
      {children}
    </div>
  );
}
