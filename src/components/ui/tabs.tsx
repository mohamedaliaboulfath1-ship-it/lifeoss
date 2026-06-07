"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex flex-wrap gap-1 mb-4 border-b border-border pb-1 relative", className)}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "relative px-3 py-2 text-sm rounded-t-sm cursor-pointer focus-ring transition-colors",
              isActive ? "text-gold2 font-semibold" : "text-text3 hover:text-text hover:bg-surface2/50"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-gold rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <motion.span
              animate={{ opacity: isActive ? 1 : 0.85 }}
              transition={{ duration: MOTION.duration.fast }}
            >
              {t.label}
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}
