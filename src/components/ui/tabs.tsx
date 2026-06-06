"use client";

import { cn } from "@/lib/utils";

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
    <div className={cn("flex flex-wrap gap-1 mb-4 border-b border-border pb-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "px-3 py-2 text-sm rounded-t-sm transition-colors cursor-pointer",
            active === t.id
              ? "bg-surface2 text-gold2 border-b-2 border-gold font-semibold"
              : "text-text3 hover:text-text hover:bg-surface2/50"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
