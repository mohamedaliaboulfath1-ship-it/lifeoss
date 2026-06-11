import { MOTION } from "./transitions";

/** Motion System V2 — reusable presets */
export const motionV2 = {
  pageTransition: {
    initial: { opacity: 0, y: MOTION.distance.md },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -MOTION.distance.sm },
    transition: { duration: MOTION.duration.normal, ease: MOTION.ease.out },
  },

  cardEntrance: (delay = 0) => ({
    initial: { opacity: 0, y: 14, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { ...MOTION.spring.soft, delay },
  }),

  staggerContainer: {
    initial: "hidden",
    animate: "show",
    variants: {
      hidden: {},
      show: { transition: { staggerChildren: MOTION.stagger.normal } },
    },
  },

  staggerItem: {
    variants: {
      hidden: { opacity: 0, y: 12 },
      show: { opacity: 1, y: 0, transition: MOTION.spring.soft },
    },
  },

  hoverLift: {
    whileHover: { y: -3, scale: 1.008 },
    whileTap: { scale: MOTION.scale.press },
    transition: MOTION.spring.snappy,
  },

  successReveal: {
    initial: { scale: 0.92, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: MOTION.spring.snappy,
  },

  achievementUnlock: {
    initial: { scale: 0.8, opacity: 0, rotate: -4 },
    animate: { scale: 1, opacity: 1, rotate: 0 },
    exit: { scale: 1.08, opacity: 0, y: -12 },
    transition: MOTION.spring.snappy,
  },

  metricCounter: {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: MOTION.duration.count, ease: MOTION.ease.out },
  },

  glowReveal: {
    initial: { opacity: 0, filter: "blur(8px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    transition: { duration: MOTION.duration.slow, ease: MOTION.ease.out },
  },

  expandSection: {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: MOTION.duration.normal, ease: MOTION.ease.out },
  },

  progressFill: {
    initial: { scaleX: 0 },
    animate: { scaleX: 1 },
    transition: { duration: MOTION.duration.chart, ease: MOTION.ease.out },
  },

  warningBreathe: {
    animate: {
      boxShadow: [
        "0 0 0 0 color-mix(in srgb, var(--amber) 0%, transparent)",
        "0 0 20px 2px color-mix(in srgb, var(--amber) 18%, transparent)",
        "0 0 0 0 color-mix(in srgb, var(--amber) 0%, transparent)",
      ],
    },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },

  criticalPulse: {
    animate: {
      borderColor: [
        "color-mix(in srgb, var(--rose) 35%, var(--border))",
        "color-mix(in srgb, var(--rose) 55%, var(--border))",
        "color-mix(in srgb, var(--rose) 35%, var(--border))",
      ],
    },
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
} as const;
