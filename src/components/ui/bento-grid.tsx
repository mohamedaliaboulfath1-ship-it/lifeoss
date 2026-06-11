"use client";

import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-3 auto-rows-min",
        className
      )}
    >
      {children}
    </div>
  );
}

type BentoSpan = "1" | "2" | "3" | "4" | "6" | "8" | "12" | "hero" | "wide" | "tall";

const SPAN_CLASS: Record<BentoSpan, string> = {
  "1": "md:col-span-2 lg:col-span-2",
  "2": "md:col-span-3 lg:col-span-3",
  "3": "md:col-span-3 lg:col-span-4",
  "4": "md:col-span-4 lg:col-span-4",
  "6": "md:col-span-6 lg:col-span-6",
  "8": "md:col-span-6 lg:col-span-8",
  "12": "md:col-span-6 lg:col-span-12",
  hero: "md:col-span-6 lg:col-span-8 md:row-span-2",
  wide: "md:col-span-6 lg:col-span-8",
  tall: "md:col-span-3 lg:col-span-4 md:row-span-2",
};

interface BentoTileProps {
  children: React.ReactNode;
  span?: BentoSpan;
  className?: string;
  delay?: number;
  interactive?: boolean;
}

export function BentoTile({
  children,
  span = "2",
  className,
  delay = 0,
  interactive = false,
}: BentoTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: MOTION.distance.sm }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration.normal, ease: MOTION.ease.out, delay }}
      className={cn(
        SPAN_CLASS[span],
        interactive && "hover:shadow-premium hover:border-gold/20 transition-shadow duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
