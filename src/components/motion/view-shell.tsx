"use client";

import { Children, isValidElement, type ReactNode } from "react";
import { PageUnfold, SectionReveal, CardGrid, AnalyticsReveal } from "@/components/motion/unfold-reveal";
import { cn } from "@/lib/utils";

interface ViewShellProps {
  children: ReactNode;
  className?: string;
  /** Sequentially unfold each top-level section (default: true) */
  stagger?: boolean;
}

/** Drop-in page wrapper — carpet unfold + optional section stagger */
export function ViewShell({ children, className, stagger = true }: ViewShellProps) {
  const content = stagger
    ? Children.map(children, (child, i) =>
        isValidElement(child) ? (
          <SectionReveal key={child.key ?? i} index={i}>
            {child}
          </SectionReveal>
        ) : (
          child
        )
      )
    : children;

  return <PageUnfold className={cn("space-y-6", className)}>{content}</PageUnfold>;
}

ViewShell.Cards = CardGrid;
ViewShell.Analytics = AnalyticsReveal;
