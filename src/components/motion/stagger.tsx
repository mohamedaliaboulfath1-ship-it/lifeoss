"use client";

import { motion } from "framer-motion";
import { dashboardStagger } from "@/lib/motion/dashboard";
import { cn } from "@/lib/utils";

export function StaggerGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={dashboardStagger.container}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={cn(className)} variants={dashboardStagger.item}>
      {children}
    </motion.div>
  );
}
