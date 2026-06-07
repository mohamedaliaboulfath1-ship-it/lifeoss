import { MOTION } from "./transitions";

export const cardEnter = {
  initial: { opacity: 0, y: MOTION.distance.sm },
  animate: { opacity: 1, y: 0 },
  transition: { duration: MOTION.duration.normal, ease: MOTION.ease.out },
} as const;

export const cardHover = {
  y: -2,
  scale: MOTION.scale.cardHover,
  transition: { duration: MOTION.duration.fast, ease: MOTION.ease.out },
} as const;

export const cardTap = {
  scale: MOTION.scale.press,
  transition: { duration: MOTION.duration.instant },
} as const;
