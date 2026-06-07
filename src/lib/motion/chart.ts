import { MOTION } from "./transitions";

export const chartBarGrow = {
  initial: { scaleY: 0, opacity: 0 },
  animate: { scaleY: 1, opacity: 1 },
  transition: { duration: MOTION.duration.chart, ease: MOTION.ease.out },
} as const;

export const chartLineDraw = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { duration: MOTION.duration.chart, ease: MOTION.ease.out },
} as const;

export const chartPointPop = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: MOTION.spring.soft,
} as const;
