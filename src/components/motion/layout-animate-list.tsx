"use client";

import { LayoutGroup, motion } from "framer-motion";
import { AutoAnimateList } from "@/components/motion/auto-animate-list";
import { cn } from "@/lib/utils";

interface LayoutAnimateListProps {
  children: React.ReactNode;
  className?: string;
  groupId?: string;
}

/** Framer layout + auto-animate for lists, KPI grids, tables */
export function LayoutAnimateList({
  children,
  className,
  groupId = "lifeos-list",
}: LayoutAnimateListProps) {
  return (
    <LayoutGroup id={groupId}>
      <AutoAnimateList className={cn(className)}>
        {children}
      </AutoAnimateList>
    </LayoutGroup>
  );
}

export function LayoutAnimateItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div layout className={className}>
      {children}
    </motion.div>
  );
}
