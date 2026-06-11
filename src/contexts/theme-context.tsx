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

function applyResolvedTheme(resolved: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [resolved, setResolved] = useState<"dark" | "light">("dark");
  const hydrated = useRef(false);
  const userChanged = useRef(false);

  const syncTheme = useCallback((mode: ThemeMode, persist = true) => {
    const next = resolveTheme(mode);
    setResolved(next);
    applyResolvedTheme(next);
    if (persist) localStorage.setItem(STORAGE_KEY, mode);
    return next;
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial =
      stored && ["dark", "light", "system"].includes(stored) ? stored : "dark";
    hydrated.current = true;
    setThemeState(initial);
    syncTheme(initial, false);

    fetch("/api/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (
          !userChanged.current &&
          json?.theme &&
          ["dark", "light", "system"].includes(json.theme)
        ) {
          setThemeState(json.theme);
          syncTheme(json.theme, false);
        }
      })
      .catch(() => {});
  }, [syncTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const next = resolveTheme("system");
      setResolved(next);
      applyResolvedTheme(next);
    };
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback(
    (t: ThemeMode) => {
      userChanged.current = true;
      setThemeState(t);
      syncTheme(t);
      fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: t }),
      }).catch(() => {});
    },
    [syncTheme]
  );

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
