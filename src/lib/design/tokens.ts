/** LifeOS Design System V2 — semantic palettes & surface levels */

export type SemanticState = "default" | "success" | "warning" | "critical" | "growth";

export type SurfaceLevel = 1 | 2 | 3 | 4;

export type AreaThemeId =
  | "body"
  | "career"
  | "finance"
  | "learning"
  | "books"
  | "health"
  | "soul"
  | "default";

export const AREA_THEMES: Record<
  AreaThemeId,
  { gradient: string; label: string; accent: string }
> = {
  body: { gradient: "area-body", label: "الجسم", accent: "var(--emerald)" },
  career: { gradient: "area-career", label: "المهنة", accent: "var(--sky)" },
  finance: { gradient: "area-finance", label: "المال", accent: "var(--gold)" },
  learning: { gradient: "area-learning", label: "التعلم", accent: "var(--purple)" },
  books: { gradient: "area-books", label: "الكتب", accent: "var(--amber)" },
  health: { gradient: "area-health", label: "الصحة", accent: "var(--teal)" },
  soul: { gradient: "area-soul", label: "الروح", accent: "var(--rose)" },
  default: { gradient: "gradient-premium-slate", label: "عام", accent: "var(--gold)" },
};

export function scoreSemanticState(value: number): SemanticState {
  if (value >= 75) return "growth";
  if (value >= 50) return "default";
  if (value >= 30) return "warning";
  return "critical";
}

export function burnoutSemanticState(risk: string): SemanticState {
  const r = risk.toLowerCase();
  if (r === "high" || r === "critical") return "critical";
  if (r === "medium" || r === "moderate") return "warning";
  return "success";
}
