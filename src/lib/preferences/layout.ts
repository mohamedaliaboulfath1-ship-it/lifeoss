export interface LayoutPreferences {
  dashboardWidgets: string[];
  areaLayout: "grid" | "list" | "command";
  accentTheme: "gold" | "indigo" | "emerald" | "sky";
  compactMode: boolean;
}

export const DEFAULT_LAYOUT: LayoutPreferences = {
  dashboardWidgets: ["lifeScore", "habits", "tasks", "goals", "time", "wealth"],
  areaLayout: "command",
  accentTheme: "gold",
  compactMode: false,
};

const STORAGE_KEY = "lifeos_layout_prefs";

export function loadLayoutPrefs(): LayoutPreferences {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    return { ...DEFAULT_LAYOUT, ...JSON.parse(raw) as Partial<LayoutPreferences> };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function saveLayoutPrefs(prefs: Partial<LayoutPreferences>) {
  const next = { ...loadLayoutPrefs(), ...prefs };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export const WIDGET_OPTIONS = [
  { id: "lifeScore", label: "Life Score", icon: "🏆" },
  { id: "habits", label: "العادات", icon: "🔄" },
  { id: "tasks", label: "المهام", icon: "✅" },
  { id: "goals", label: "الأهداف", icon: "🎯" },
  { id: "time", label: "الوقت", icon: "⏱️" },
  { id: "wealth", label: "الثروة", icon: "💎" },
  { id: "career", label: "المهنة", icon: "💼" },
  { id: "learning", label: "التعلم", icon: "🧠" },
  { id: "body", label: "الجسم", icon: "💪" },
];
