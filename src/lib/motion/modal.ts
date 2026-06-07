import { MOTION } from "./transitions";

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: MOTION.duration.fast, ease: MOTION.ease.out },
} as const;

export const modalPanel = {
  initial: { opacity: 0, y: MOTION.distance.md, scale: MOTION.scale.modalIn },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: MOTION.distance.sm, scale: MOTION.scale.modalIn },
  transition: MOTION.spring.modal,
} as const;

export const dropdownPanel = {
  initial: { opacity: 0, y: -4, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
  transition: { duration: MOTION.duration.fast, ease: MOTION.ease.out },
} as const;
