import { MOTION } from "./transitions";

/** Liquid Glass motion presets — GPU-only (opacity + transform) */
export const glassMotion = {
  pageEntry: {
    initial: { opacity: 0, y: 16, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: MOTION.duration.slow, ease: MOTION.ease.out },
  },
  cardUnfold: (delay = 0) => ({
    initial: { opacity: 0, y: 28, scale: 0.94, rotateX: 8 },
    animate: { opacity: 1, y: 0, scale: 1, rotateX: 0 },
    transition: { ...MOTION.spring.soft, delay },
  }),
  stagger: (i: number) => ({
    initial: { opacity: 0, y: 20, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: MOTION.duration.normal, ease: MOTION.ease.out, delay: i * MOTION.stagger.normal },
  }),
  hoverLift: {
    whileHover: { y: -3, scale: 1.01 },
    whileTap: { scale: 0.985, y: 0 },
    transition: MOTION.spring.snappy,
  },
  modalExpand: {
    initial: { opacity: 0, scale: 0.92, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 8 },
    transition: MOTION.spring.modal,
  },
  liquidPress: {
    whileTap: { scale: 0.97 },
    transition: { duration: MOTION.duration.instant },
  },
  successPulse: {
    animate: {
      boxShadow: [
        "0 0 0 0 color-mix(in srgb, var(--success) 0%, transparent)",
        "0 0 24px 4px color-mix(in srgb, var(--success) 35%, transparent)",
        "0 0 0 0 color-mix(in srgb, var(--success) 0%, transparent)",
      ],
    },
    transition: { duration: 0.6, ease: MOTION.ease.out },
  },
  celebration: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.06, 1] },
    transition: { duration: 0.5, ease: MOTION.ease.out },
  },
  sidebarSlide: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { duration: MOTION.duration.normal, ease: MOTION.ease.out },
  },
};
