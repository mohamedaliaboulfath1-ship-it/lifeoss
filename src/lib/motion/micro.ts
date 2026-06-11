import { MOTION } from "./transitions";

/** Sub-500ms micro-interactions — haptic-like, alive */
export const micro = {
  ripple: {
    initial: { scale: 0, opacity: 0.45 },
    animate: { scale: 2.8, opacity: 0 },
    transition: { duration: MOTION.duration.normal, ease: MOTION.ease.out },
  },
  successPulse: {
    scale: [1, 1.18, 1] as number[],
    transition: { duration: MOTION.duration.fast, ease: MOTION.ease.out },
  },
  hapticPress: {
    scale: MOTION.scale.press,
    transition: { duration: MOTION.duration.instant },
  },
  scoreBump: {
    scale: [1, 1.06, 1] as number[],
    transition: { duration: MOTION.duration.normal, ease: MOTION.ease.out },
  },
  counterPop: {
    initial: { y: 4, opacity: 0.5 },
    animate: { y: 0, opacity: 1 },
    transition: MOTION.spring.snappy,
  },
} as const;
