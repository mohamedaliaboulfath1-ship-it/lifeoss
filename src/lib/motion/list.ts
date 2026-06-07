import { MOTION } from "./transitions";

export const listContainer = {
  animate: { transition: { staggerChildren: MOTION.stagger.normal } },
} as const;

export const listItem = {
  initial: { opacity: 0, y: MOTION.distance.sm },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -8, height: 0, marginTop: 0, marginBottom: 0 },
  transition: { duration: MOTION.duration.normal, ease: MOTION.ease.out },
} as const;

export const taskCompleteExit = {
  opacity: 0,
  x: -12,
  height: 0,
  marginBottom: 0,
  transition: { duration: MOTION.duration.slow, ease: MOTION.ease.inOut },
} as const;

export const habitCheckPop = {
  initial: { scale: 0.5, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: MOTION.spring.snappy,
} as const;
