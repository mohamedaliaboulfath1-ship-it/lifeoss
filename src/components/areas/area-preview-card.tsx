"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { LayeredCard } from "@/components/ui/layered-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { AREA_THEMES, scoreSemanticState, type AreaThemeId } from "@/lib/design/tokens";
import { useExpandTransitionOptional } from "@/contexts/goal-expand-context";
import { cardHover, cardTap } from "@/lib/motion/card";
import type { AreaPreview } from "@/types/areas";

interface Props {
  preview: AreaPreview;
}

export function AreaPreviewCard({ preview }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const expand = useExpandTransitionOptional();

  function handleOpen() {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    if (expand) {
      expand.expandCard(
        {
          entity: "area",
          id: preview.slug,
          title: preview.nameAr,
          subtitle: "Area Command Center",
          progress: preview.healthScore,
          icon: preview.icon,
          href: `/areas/${preview.slug}`,
        },
        rect
      );
    } else {
      window.location.href = `/areas/${preview.slug}`;
    }
  }

  return (
    <motion.div
      ref={ref}
      whileHover={cardHover}
      whileTap={cardTap}
      onClick={handleOpen}
      className="cursor-pointer h-full"
    >
      <LayeredCard
        gradient={areaGradient(preview.slug)}
        state={scoreSemanticState(preview.healthScore)}
        level={2}
        className="p-4 h-full group"
        style={{ borderColor: `${preview.color}40` }}
      >
        <div className="flex items-start gap-3 mb-3">
          <ProgressRing
            value={preview.healthScore}
            size={52}
            strokeWidth={4}
            color={preview.color}
            showValue
            suffix="%"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">{preview.icon}</span>
              <div className="font-bold group-hover:text-gold2 transition-colors truncate">
                {preview.nameAr}
              </div>
            </div>
            <div className="text-[10px] text-text3 mt-1">Health Score</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
          <StatChip label="أهداف" value={preview.activeGoals} />
          <StatChip label="عادات" value={preview.habits} />
          <StatChip label="مهام" value={preview.tasks} />
          <StatChip label="كتب" value={preview.books} />
        </div>

        {preview.highlights.slice(0, 3).map((h) => (
          <div key={h.label} className="text-[10px] text-text3 truncate">
            <span className="text-text2">{h.label}:</span> {h.value}
          </div>
        ))}

        {preview.needsAttention.length > 0 && (
          <div className="mt-2 text-[10px] text-amber2 border-t border-border/50 pt-2 truncate">
            ⚠️ {preview.needsAttention[0]}
          </div>
        )}
      </LayeredCard>
    </motion.div>
  );
}

function areaGradient(slug: string): string {
  const map: Record<string, AreaThemeId> = {
    body: "body",
    health: "health",
    career: "career",
    finance: "finance",
    learning: "learning",
    books: "books",
    soul: "soul",
  };
  const id = map[slug] ?? "default";
  return AREA_THEMES[id].gradient;
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-2 py-1 rounded-sm bg-surface2/80 flex justify-between">
      <span className="text-text3">{label}</span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
}
