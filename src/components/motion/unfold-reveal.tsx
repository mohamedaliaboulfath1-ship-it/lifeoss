"use client";

import { Children, isValidElement, type ReactNode } from "react";
import { motion } from "framer-motion";
import { UNFOLD } from "@/lib/motion/unfold";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const ORIGIN = UNFOLD.origin;

/** Page container — carpet rolls out */
export function PageUnfold({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={UNFOLD.page.initial}
      animate={UNFOLD.page.animate}
      transition={UNFOLD.page.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Section block — unfolds after page */
export function SectionReveal({
  children,
  className,
  index = 0,
  delay,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const d = delay ?? index * UNFOLD.stagger;
  const motionProps = UNFOLD.section(d);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      {...motionProps}
      style={ORIGIN}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Single card — staggered unfold */
export function CardUnfold({
  children,
  className,
  index = 0,
  baseDelay = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  baseDelay?: number;
}) {
  const reduced = useReducedMotion();
  const motionProps = UNFOLD.card(index, baseDelay);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      {...motionProps}
      style={ORIGIN}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Chart / analytics block */
export function AnalyticsReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const motionProps = UNFOLD.analytics(delay);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      {...motionProps}
      style={ORIGIN}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type DashboardRevealProps = { children: ReactNode; className?: string };

function DashboardRoot({ children, className }: DashboardRevealProps) {
  return <PageUnfold className={cn("space-y-5 md:space-y-6", className)}>{children}</PageUnfold>;
}

function DashboardHeader({ children, className }: DashboardRevealProps) {
  return <SectionReveal index={0} className={className}>{children}</SectionReveal>;
}

function DashboardKpis({
  children,
  className,
  columns,
}: DashboardRevealProps & { columns?: string }) {
  return (
    <SectionReveal index={1}>
      <CardGrid columns={columns ?? "grid grid-cols-2 xl:grid-cols-3 gap-4"} className={className}>
        {children}
      </CardGrid>
    </SectionReveal>
  );
}

function DashboardCharts({ children, className }: DashboardRevealProps) {
  return (
    <SectionReveal index={2} className={className}>
      <AnalyticsReveal delay={0.05}>{children}</AnalyticsReveal>
    </SectionReveal>
  );
}

function DashboardInsights({ children, className }: DashboardRevealProps) {
  return <SectionReveal index={3} delay={0.45} className={className}>{children}</SectionReveal>;
}

/** Staggered card grid — KPIs, widgets, goal cards */
export function CardGrid({
  children,
  className,
  columns,
  baseDelay = 0,
}: {
  children: ReactNode;
  className?: string;
  columns?: string;
  baseDelay?: number;
}) {
  const grid = columns ?? "grid grid-cols-2 xl:grid-cols-4 gap-4";
  return (
    <div className={cn(grid, className)}>
      {Children.map(children, (child, i) =>
        isValidElement(child) ? (
          <CardUnfold key={child.key ?? i} index={i} baseDelay={baseDelay}>
            {child}
          </CardUnfold>
        ) : null
      )}
    </div>
  );
}

/** Bookshelf — shelf fades in, rows reveal sequentially */
export function ShelfReveal({
  children,
  className,
  rowIndex = 0,
}: {
  children: ReactNode;
  className?: string;
  rowIndex?: number;
}) {
  return (
    <SectionReveal index={rowIndex} delay={rowIndex * 0.12} className={className}>
      {children}
    </SectionReveal>
  );
}

export const DashboardReveal = Object.assign(DashboardRoot, {
  Header: DashboardHeader,
  Kpis: DashboardKpis,
  Charts: DashboardCharts,
  Insights: DashboardInsights,
});
