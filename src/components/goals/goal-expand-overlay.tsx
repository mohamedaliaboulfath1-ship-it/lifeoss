"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useExpandTransition, type ExpandEntity } from "@/contexts/goal-expand-context";
import { MOTION } from "@/lib/motion";
import { areaColor } from "@/lib/calculations";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const ENTITY_ICON: Record<ExpandEntity, string> = {
  goal: "🎯",
  project: "📁",
  task: "✅",
  book: "📚",
  area: "🗂️",
};

export function GoalExpandOverlay() {
  const { phase, snapshot, clearExpand } = useExpandTransition();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (phase !== "morphing" || !snapshot) return;
    const t = setTimeout(() => clearExpand(), reduced ? 0 : 480);
    return () => clearTimeout(t);
  }, [phase, snapshot, clearExpand, reduced]);

  if (!snapshot || phase === "idle") return null;

  const { rect, title, progress = 0, entity, subtitle, icon } = snapshot;
  const color =
    entity === "goal" || entity === "project"
      ? areaColor("career")
      : entity === "area"
        ? "var(--sky)"
        : entity === "book"
          ? "var(--purple2)"
          : "var(--emerald)";

  if (reduced) return null;

  return (
    <AnimatePresence>
      {phase === "morphing" && (
        <motion.div
          key="expand-morph"
          className="fixed z-[180] overflow-hidden glass-premium border border-gold/20 shadow-premium pointer-events-none"
          initial={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: 12,
          }}
          animate={{
            top: 0,
            left: 0,
            width: "100vw",
            height: "100dvh",
            borderRadius: 0,
          }}
          exit={{ opacity: 0 }}
          transition={MOTION.spring.modal}
        >
          <motion.div
            className="h-full flex flex-col p-6 md:p-10"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 0.18, duration: MOTION.duration.normal }}
          >
            <div className="flex items-start gap-4">
              {(entity === "goal" || entity === "project") && progress > 0 ? (
                <ProgressRing
                  value={progress}
                  size={72}
                  color={color}
                  strokeWidth={5}
                  showValue
                  suffix="%"
                />
              ) : (
                <span className="text-4xl">{icon ?? ENTITY_ICON[entity]}</span>
              )}
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-[10px] uppercase tracking-widest text-text3 mb-1">
                  {subtitle ?? entity}
                </p>
                <h2 className="font-display text-xl md:text-2xl font-black text-gold2 truncate">
                  {title}
                </h2>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
