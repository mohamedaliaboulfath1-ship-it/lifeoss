"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MOTION } from "@/lib/motion";
import type { Achievement } from "@/contexts/achievement-context";

const KIND_EMOJI: Record<string, string> = {
  habit: "✅",
  task: "🎯",
  goal: "🏆",
  weight: "⚖️",
  finance: "💰",
  learning: "📚",
  streak: "🔥",
};

export function AchievementBurst({ achievement }: { achievement: Achievement | null }) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          key={achievement.id}
          className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION.duration.fast }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.05, opacity: 0, y: -8 }}
            transition={MOTION.spring.snappy}
            className="px-6 py-4 rounded-2xl glass-premium border border-gold/30 shadow-premium-lg text-center max-w-sm mx-4"
          >
            <motion.span
              className="text-4xl block mb-2"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.4, ease: MOTION.ease.out }}
            >
              {achievement.emoji ?? KIND_EMOJI[achievement.kind] ?? "✨"}
            </motion.span>
            <div className="font-bold text-gold2 text-sm">{achievement.title}</div>
            {achievement.subtitle && (
              <div className="text-xs text-text3 mt-1">{achievement.subtitle}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
