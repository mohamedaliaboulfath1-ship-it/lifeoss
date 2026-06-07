/**
 * LifeOS Pro Motion System — unified tokens
 * Philosophy: fast, smooth, calm, premium (Linear / Apple / Notion)
 * GPU-friendly: opacity + transform only
 */

export const MOTION = {
  duration: {
    instant: 0.1,
    fast: 0.15,
    normal: 0.22,
    slow: 0.32,
    chart: 0.55,
    count: 0.5,
  },
  /** Apple / Material standard easing */
  ease: {
    out: [0.22, 1, 0.36, 1] as const,
    inOut: [0.4, 0, 0.2, 1] as const,
    in: [0.4, 0, 1, 1] as const,
  },
  spring: {
    snappy: { type: "spring" as const, stiffness: 500, damping: 38, mass: 0.85 },
    soft: { type: "spring" as const, stiffness: 400, damping: 32, mass: 0.9 },
    modal: { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.95 },
  },
  stagger: {
    tight: 0.035,
    normal: 0.055,
    relaxed: 0.075,
  },
  distance: { sm: 6, md: 10 },
  scale: {
    press: 0.975,
    cardHover: 1.006,
    modalIn: 0.98,
  },
} as const;

export const gpu = "will-change-transform transform-gpu";
