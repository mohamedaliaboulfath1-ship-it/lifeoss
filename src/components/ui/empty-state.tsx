"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  example?: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  className?: string;
}

export function EmptyState({
  icon = "✦",
  title,
  description,
  example,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-14 px-6 rounded-[12px]",
        "border border-dashed border-border2",
        "bg-gradient-to-b from-surface/80 to-surface2/40 shadow-premium",
        className
      )}
    >
      <div
        className="text-5xl mb-4 opacity-90 select-none"
        aria-hidden
      >
        {icon}
      </div>
      <h3 className="font-bold text-text text-base mb-1.5">{title}</h3>
      {description && (
        <p className="text-text2 text-sm max-w-md mb-3 leading-relaxed">{description}</p>
      )}
      {example && (
        <p className="text-text3 text-xs max-w-sm mb-5 font-mono bg-surface2/60 px-3 py-2 rounded-sm border border-border/60">
          مثال: {example}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="gold" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
