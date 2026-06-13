/** Liquid Glass Design System — domain gradients & semantic glows */

export type GlassDomain =
  | "health"
  | "finance"
  | "career"
  | "learning"
  | "body"
  | "mind"
  | "soul"
  | "goals"
  | "default";

export type GlassSemantic = "success" | "warning" | "critical" | "default";

export const GLASS_GRADIENTS: Record<
  GlassDomain,
  { from: string; to: string; css: string; glow: string; className: string }
> = {
  health: {
    from: "#10b981",
    to: "#06b6d4",
    css: "linear-gradient(145deg, #064e3b 0%, #0d9488 45%, #06b6d4 100%)",
    glow: "color-mix(in srgb, #10b981 28%, transparent)",
    className: "glass-gradient-health",
  },
  finance: {
    from: "#3b82f6",
    to: "#4f46e5",
    css: "linear-gradient(145deg, #1e3a8a 0%, #2563eb 50%, #4338ca 100%)",
    glow: "color-mix(in srgb, #3b82f6 28%, transparent)",
    className: "glass-gradient-finance",
  },
  career: {
    from: "#8b5cf6",
    to: "#7c3aed",
    css: "linear-gradient(145deg, #4c1d95 0%, #7c3aed 50%, #6d28d9 100%)",
    glow: "color-mix(in srgb, #8b5cf6 28%, transparent)",
    className: "glass-gradient-career",
  },
  learning: {
    from: "#f97316",
    to: "#f59e0b",
    css: "linear-gradient(145deg, #9a3412 0%, #ea580c 50%, #f59e0b 100%)",
    glow: "color-mix(in srgb, #f97316 28%, transparent)",
    className: "glass-gradient-learning",
  },
  body: {
    from: "#14b8a6",
    to: "#10b981",
    css: "linear-gradient(145deg, #134e4a 0%, #0d9488 50%, #10b981 100%)",
    glow: "color-mix(in srgb, #14b8a6 28%, transparent)",
    className: "glass-gradient-body",
  },
  mind: {
    from: "#6366f1",
    to: "#a855f7",
    css: "linear-gradient(145deg, #312e81 0%, #6366f1 50%, #9333ea 100%)",
    glow: "color-mix(in srgb, #6366f1 28%, transparent)",
    className: "glass-gradient-mind",
  },
  soul: {
    from: "#ec4899",
    to: "#8b5cf6",
    css: "linear-gradient(145deg, #831843 0%, #db2777 50%, #7c3aed 100%)",
    glow: "color-mix(in srgb, #ec4899 28%, transparent)",
    className: "glass-gradient-soul",
  },
  goals: {
    from: "#3b82f6",
    to: "#8b5cf6",
    css: "linear-gradient(145deg, #1d4ed8 0%, #6366f1 50%, #7c3aed 100%)",
    glow: "color-mix(in srgb, #6366f1 28%, transparent)",
    className: "glass-gradient-goals",
  },
  default: {
    from: "var(--gold)",
    to: "var(--sky)",
    css: "linear-gradient(145deg, color-mix(in srgb, var(--gold) 20%, var(--surface)) 0%, color-mix(in srgb, var(--sky) 15%, var(--surface2)) 100%)",
    glow: "color-mix(in srgb, var(--gold) 18%, transparent)",
    className: "glass-gradient-default",
  },
};

export const GLASS_SEMANTIC: Record<GlassSemantic, string> = {
  success: "glass-glow-success",
  warning: "glass-glow-warning",
  critical: "glass-glow-critical",
  default: "",
};

export const GLASS_BLUR = {
  sm: "glass-blur-sm",
  md: "glass-blur-md",
  lg: "glass-blur-lg",
  xl: "glass-blur-xl",
} as const;

export type GlassBlur = keyof typeof GLASS_BLUR;
