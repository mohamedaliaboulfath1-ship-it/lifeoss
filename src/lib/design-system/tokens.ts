/** LifeOS Pro design tokens — typography, spacing, motion, elevation */

export const typography = {
  display: "font-display text-3xl font-black",
  h1: "text-xl font-extrabold",
  h2: "text-lg font-bold",
  h3: "text-base font-semibold",
  body: "text-sm",
  caption: "text-xs text-text3",
  mono: "font-mono text-xs",
} as const;

export const spacing = {
  page: "p-7",
  card: "p-4",
  cardLg: "p-6",
  gap: "gap-4",
  gapSm: "gap-2",
} as const;

export const elevation = {
  card: "border border-border rounded-[10px] bg-surface",
  cardHover: "hover:border-border2 hover:shadow-lg transition-all duration-200",
  dropdown: "border border-border2 rounded-[10px] shadow-xl bg-surface",
  modal: "border border-border2 rounded-[10px] shadow-2xl bg-surface",
} as const;

export const motion = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
  ease: [0.25, 0.1, 0.25, 1] as const,
} as const;

export const domainColors: Record<string, string> = {
  body: "var(--teal)",
  finance: "var(--gold)",
  career: "var(--sky)",
  learning: "var(--purple)",
  discipline: "var(--coral)",
  spiritual: "var(--emerald)",
  relationships: "var(--rose)",
  self_dev: "var(--amber)",
};
