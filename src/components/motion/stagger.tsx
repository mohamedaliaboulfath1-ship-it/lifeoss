"use client";

import { Children, isValidElement } from "react";
import { motion } from "framer-motion";
import { UNFOLD } from "@/lib/motion/unfold";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/** @deprecated Prefer DashboardReveal / SectionReveal — kept for dashboard compat */
export function StaggerGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={UNFOLD.page.initial}
      animate={UNFOLD.page.animate}
      transition={UNFOLD.page.transition}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  const reduced = useReducedMotion();
  const unfold = UNFOLD.section(index * UNFOLD.stagger);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div {...unfold} style={UNFOLD.origin} className={cn(className)}>
      {children}
    </motion.div>
  );
}

/** Unfold children as cards inside a section */
export function StaggerCards({
  children,
  className,
  baseIndex = 0,
}: {
  children: React.ReactNode;
  className?: string;
  baseIndex?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <div className={className}>
      {Children.map(children, (child, i) =>
        isValidElement(child) ? (
          <motion.div
            key={child.key ?? i}
            {...UNFOLD.card(i, baseIndex * UNFOLD.stagger)}
            style={UNFOLD.origin}
          >
            {child}
          </motion.div>
        ) : null
      )}
    </div>
  );
}
