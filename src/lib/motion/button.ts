import { MOTION } from "./transitions";

export const buttonHover = {
  y: -1,
  transition: { duration: MOTION.duration.fast, ease: MOTION.ease.out },
} as const;

export const buttonTap = {
  scale: MOTION.scale.press,
  y: 0,
  transition: { duration: MOTION.duration.instant },
} as const;

export const buttonSuccess = {
  scale: [1, 1.04, 1],
  transition: { duration: MOTION.duration.normal, ease: MOTION.ease.out },
} as const;

export const spinnerTransition = {
  rotate: 360,
  transition: { duration: 0.8, repeat: Infinity, ease: "linear" as const },
} as const;
