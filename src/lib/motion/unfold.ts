import { MOTION } from "./transitions";

/** Unfold / Carpet Reveal — premium page & card entrance */
export const UNFOLD = {
  stagger: 0.18,
  cardStagger: 0.15,

  page: {
    initial: { opacity: 0, y: 8, scale: 0.995 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.34, ease: MOTION.ease.out },
  },

  section: (delay = 0) => ({
    initial: {
      opacity: 0,
      y: 14,
      scale: 0.98,
      filter: "blur(6px)",
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
    },
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 34,
      mass: 0.9,
      delay,
    },
  }),

  card: (index = 0, baseDelay = 0) => ({
    initial: {
      opacity: 0,
      y: 10,
      scale: 0.96,
      filter: "blur(4px)",
      boxShadow: "0 0 0 rgba(0,0,0,0)",
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      boxShadow: "0 4px 24px color-mix(in srgb, var(--bg) 35%, transparent)",
    },
    transition: {
      type: "spring" as const,
      stiffness: 420,
      damping: 36,
      mass: 0.85,
      delay: baseDelay + index * UNFOLD.cardStagger,
    },
  }),

  analytics: (delay = 0) => ({
    initial: { opacity: 0, y: 16, scale: 0.97, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    transition: {
      duration: MOTION.duration.chart,
      ease: MOTION.ease.out,
      delay,
    },
  }),

  origin: { transformOrigin: "top center" } as const,
};
