import { MOTION } from "./transitions";

export const dashboardStagger = {
  container: {
    animate: {
      transition: {
        staggerChildren: MOTION.stagger.tight,
        delayChildren: 0.04,
      },
    },
  },
  item: {
    initial: { opacity: 0, y: MOTION.distance.sm },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION.duration.normal, ease: MOTION.ease.out },
    },
  },
} as const;

export const kpiPulse = {
  scale: [1, 1.02, 1],
  transition: { duration: MOTION.duration.slow, ease: MOTION.ease.out },
} as const;

export const progressFill = {
  transition: { duration: MOTION.duration.slow, ease: MOTION.ease.out },
} as const;
