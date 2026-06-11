"use client";

import { cn } from "@/lib/utils";

export interface HubListItem {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  healthScore?: number;
  trend?: "up" | "down" | "stable";
  childCount: number;
  domainSlug?: string;
}

interface LifeMapHubSidebarProps {
  hubs: HubListItem[];
  activeHubId: string | null;
  onSelectHub: (hubId: string | null) => void;
}

export function LifeMapHubSidebar({ hubs, activeHubId, onSelectHub }: LifeMapHubSidebarProps) {
  return (
    <aside className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-l border-border/40 bg-surface/50 overflow-y-auto max-h-[200px] lg:max-h-none">
      <div className="p-3 space-y-1">
        <button
          type="button"
          onClick={() => onSelectHub(null)}
          className={cn(
            "w-full text-right px-3 py-2 rounded-xl text-xs transition-colors",
            activeHubId === null
              ? "bg-gold/15 text-gold2 border border-gold/30"
              : "hover:bg-surface2 text-text2"
          )}
        >
          🌐 نظرة عامة
        </button>
        {hubs.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => onSelectHub(h.id)}
            className={cn(
              "w-full text-right px-3 py-2.5 rounded-xl text-xs transition-colors border border-transparent",
              activeHubId === h.id
                ? "bg-surface2 border-border2"
                : "hover:bg-surface2/60"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold truncate">
                {h.icon} {h.label}
              </span>
              {h.healthScore != null && (
                <span className="font-mono text-[10px] shrink-0" style={{ color: h.color }}>
                  {h.healthScore}%
                </span>
              )}
            </div>
            <div className="text-[10px] text-text3 mt-0.5">
              {h.childCount > 0 ? `${h.childCount} عنصر` : "فارغ"}
              {h.trend === "up" && " · ↑"}
              {h.trend === "down" && " · ↓"}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
