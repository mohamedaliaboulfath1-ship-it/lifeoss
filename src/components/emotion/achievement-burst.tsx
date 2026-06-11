"use client";

import { AnimatePresence, motion } from "framer-motion";
import { motionV2 } from "@/lib/motion/presets-v2";
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

const KIND_STATE: Record<string, string> = {
  habit: "state-success",
  task: "state-success",
  goal: "state-growth",
  weight: "state-growth",
  finance: "state-growth",
  learning: "state-growth",
  streak: "state-success",
};

const PARTICLES = Array.from({ length: 8 }, (_, i) => i);

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
          transition={{ duration: 0.15 }}
        >
          {PARTICLES.map((p) => (
            <motion.span
              key={p}
              className="absolute w-1.5 h-1.5 rounded-full bg-emerald2"
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0],
                x: Math.cos((p / 8) * Math.PI * 2) * 80,
                y: Math.sin((p / 8) * Math.PI * 2) * 80,
              }}
              transition={{ duration: 0.7, delay: p * 0.03, ease: "easeOut" }}
            />
          ))}

          <motion.div
            {...motionV2.achievementUnlock}
            className={`px-8 py-5 rounded-2xl glass-premium border shadow-premium-lg text-center max-w-sm mx-4 layered-card ${KIND_STATE[achievement.kind] ?? "state-success"}`}
          >
            <motion.span
              className="text-5xl block mb-3"
              animate={{ scale: [1, 1.25, 1], rotate: [0, -8, 0] }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {achievement.emoji ?? KIND_EMOJI[achievement.kind] ?? "✨"}
            </motion.span>
            <div className="font-bold text-gold2 text-base">{achievement.title}</div>
            {achievement.subtitle && (
              <div className="text-xs text-text2 mt-2">{achievement.subtitle}</div>
            )}
            <motion.div
              className="mt-3 h-0.5 rounded-full bg-gradient-to-r from-emerald via-gold to-sky"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
