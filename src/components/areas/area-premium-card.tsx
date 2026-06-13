"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ProgressRing } from "@/components/ui/progress-ring";
import { getAreaGradient } from "@/lib/areas/gradients";
import { useExpandTransitionOptional } from "@/contexts/goal-expand-context";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { AreaPreview } from "@/types/areas";
import { cn } from "@/lib/utils";

interface Props {
  preview: AreaPreview;
  index?: number;
}

const CARD_UNFOLD = (index: number) => ({
  initial: { opacity: 0, scale: 0.92, rotateX: 15, y: 60 },
  animate: { opacity: 1, scale: 1, rotateX: 0, y: 0 },
  transition: {
    type: "spring" as const,
    stiffness: 340,
    damping: 28,
    mass: 0.9,
    delay: index * 0.08,
  },
});

export function AreaPremiumCard({ preview, index = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const expand = useExpandTransitionOptional();
  const reduced = useReducedMotion();
  const gradient = getAreaGradient(preview.slug);

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

  const motionProps = reduced
    ? {}
    : CARD_UNFOLD(index);

  return (
    <motion.div
      ref={ref}
      {...motionProps}
      style={{ transformPerspective: 1200, transformOrigin: "center bottom" }}
      whileHover={reduced ? undefined : { scale: 1.03, y: -4 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      onClick={handleOpen}
      className="cursor-pointer h-full group"
    >
      <div
        className="area-premium-card relative h-full rounded-2xl p-[1px] overflow-hidden"
        style={{
          background: gradient.css,
          boxShadow: `0 8px 32px ${gradient.glow}`,
        }}
      >
        <div className="area-premium-card-inner relative h-full rounded-[15px] p-5 flex flex-col liquid-glass glass-blur-lg glass-reflect">
          <div className="area-card-shine absolute inset-0 pointer-events-none" aria-hidden />

          <div className="flex items-start justify-between gap-3 mb-4 relative z-[1]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl shrink-0"
                style={{ background: `linear-gradient(135deg, ${gradient.from}33, ${gradient.to}22)` }}
              >
                {preview.icon}
              </span>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-base truncate group-hover:text-gold2 transition-colors">
                  {preview.nameAr}
                </h3>
                <p className="text-[10px] text-text3 uppercase tracking-wider">Life Area</p>
              </div>
            </div>
            <ProgressRing
              value={preview.healthScore}
              size={56}
              strokeWidth={4}
              color={gradient.from}
              showValue
              suffix="%"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 relative z-[1]">
            <StatPill label="أهداف" value={preview.activeGoals} />
            <StatPill label="مشاريع" value={preview.projects} />
            <StatPill label="عادات" value={preview.habits} />
            <StatPill label="مهام" value={preview.tasks} />
          </div>

          <div className="space-y-2 mt-auto relative z-[1]">
            <div className="rounded-lg px-3 py-2 bg-surface/40 border border-border/30">
              <div className="text-[9px] uppercase tracking-wider text-text3 mb-0.5">التركيز الحالي</div>
              <div className="text-xs font-medium truncate">{preview.currentFocus}</div>
            </div>
            <div className="rounded-lg px-3 py-2 bg-surface/40 border border-border/30">
              <div className="text-[9px] uppercase tracking-wider text-text3 mb-0.5">الخطوة التالية</div>
              <div className={cn(
                "text-xs truncate",
                preview.needsAttention.length > 0 ? "text-amber2" : "text-text2"
              )}>
                {preview.nextAction}
              </div>
            </div>
          </div>

          {preview.needsAttention.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber2 relative z-[1]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber2 animate-pulse" />
              يحتاج انتباه
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 bg-surface/50 border border-border/25 text-[11px]">
      <span className="text-text3">{label}</span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
}
