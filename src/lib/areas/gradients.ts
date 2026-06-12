/** Premium area gradients — Life Areas redesign */

export interface AreaGradient {
  from: string;
  to: string;
  css: string;
  glow: string;
}

export const AREA_GRADIENTS: Record<string, AreaGradient> = {
  body: {
    from: "#00C6FF",
    to: "#0072FF",
    css: "linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)",
    glow: "rgba(0, 114, 255, 0.35)",
  },
  finance: {
    from: "#F7971E",
    to: "#FFD200",
    css: "linear-gradient(135deg, #F7971E 0%, #FFD200 100%)",
    glow: "rgba(247, 151, 30, 0.35)",
  },
  career: {
    from: "#8E2DE2",
    to: "#4A00E0",
    css: "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)",
    glow: "rgba(142, 45, 226, 0.35)",
  },
  learning: {
    from: "#11998E",
    to: "#38EF7D",
    css: "linear-gradient(135deg, #11998E 0%, #38EF7D 100%)",
    glow: "rgba(17, 153, 142, 0.35)",
  },
  relationships: {
    from: "#FF5F6D",
    to: "#FFC371",
    css: "linear-gradient(135deg, #FF5F6D 0%, #FFC371 100%)",
    glow: "rgba(255, 95, 109, 0.35)",
  },
  spiritual: {
    from: "#614385",
    to: "#516395",
    css: "linear-gradient(135deg, #614385 0%, #516395 100%)",
    glow: "rgba(97, 67, 133, 0.35)",
  },
  self_development: {
    from: "#FF9966",
    to: "#FF5E62",
    css: "linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)",
    glow: "rgba(255, 94, 98, 0.35)",
  },
  discipline: {
    from: "#3CA55C",
    to: "#B5AC49",
    css: "linear-gradient(135deg, #3CA55C 0%, #B5AC49 100%)",
    glow: "rgba(60, 165, 92, 0.35)",
  },
};

export function getAreaGradient(slug: string): AreaGradient {
  return AREA_GRADIENTS[slug] ?? {
    from: "#64748b",
    to: "#334155",
    css: "linear-gradient(135deg, #64748b 0%, #334155 100%)",
    glow: "rgba(100, 116, 139, 0.3)",
  };
}
