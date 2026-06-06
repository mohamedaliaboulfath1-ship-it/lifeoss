"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: ThemeMode;
  resolved: "dark" | "light";
  setTheme: (t: ThemeMode) => void;
}

const STORAGE_KEY = "lifeos-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(mode: ThemeMode): "dark" | "light" {
  if (mode === "system" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return mode === "light" ? "light" : "dark";
}

function applyTheme(mode: ThemeMode) {
  const next = resolveTheme(mode);
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(STORAGE_KEY, mode);
  return next;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [resolved, setResolved] = useState<"dark" | "light">("dark");
  const hydrated = useRef(false);
  const userChanged = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial =
      stored && ["dark", "light", "system"].includes(stored) ? stored : "dark";
    setThemeState(initial);
    setResolved(applyTheme(initial));
    hydrated.current = true;

    fetch("/api/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (
          !userChanged.current &&
          json?.theme &&
          ["dark", "light", "system"].includes(json.theme)
        ) {
          setThemeState(json.theme);
          setResolved(applyTheme(json.theme));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const next = resolveTheme(theme);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, theme);
    setResolved(next);

    if (userChanged.current) {
      fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      }).catch(() => {});
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => setResolved(resolveTheme("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: ThemeMode) => {
    userChanged.current = true;
    setThemeState(t);
  }, []);

  const value = useMemo(
    () => ({ theme, resolved, setTheme }),
    [theme, resolved, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
