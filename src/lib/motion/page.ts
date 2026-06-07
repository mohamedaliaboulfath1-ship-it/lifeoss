import { MOTION } from "./transitions";

export const pageMotion = {
  initial: { opacity: 0, y: MOTION.distance.sm },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -MOTION.distance.sm / 2 },
  transition: {
    duration: MOTION.duration.normal,
    ease: MOTION.ease.out,
  },
} as const;
