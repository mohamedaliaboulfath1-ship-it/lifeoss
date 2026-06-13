"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "gold" | "ghost" | "danger";
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  example?: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  /** Intelligent empty state — multiple suggested actions */
  suggestedActions?: EmptyStateAction[];
  className?: string;
}

export function EmptyState({
  icon = "✦",
  title,
  description,
  example,
  actionLabel,
  onAction,
  suggestedActions,
  className,
}: EmptyStateProps) {
  const actions: EmptyStateAction[] =
    suggestedActions ??
    (actionLabel
      ? [{ label: actionLabel, onClick: onAction, variant: "gold" as const }]
      : []);

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
      <div className="text-5xl mb-4 opacity-90 select-none" aria-hidden>
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
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {actions.map((action) =>
            action.href ? (
              <Link key={action.label} href={action.href}>
                <Button variant={action.variant ?? "ghost"} size="sm">
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button
                key={action.label}
                variant={action.variant ?? "ghost"}
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          )}
        </div>
      )}
    </motion.div>
  );
}
