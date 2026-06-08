"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { YearPayload } from "@/types/lifeos";
import type { DashboardSnapshot } from "@/types/lifeos-pro";

interface Profile {
  displayName: string;
  city?: string | null;
  age?: number | null;
  height?: number | null;
  startWeight?: number | null;
  targetWeight?: number | null;
  currentWeight?: number | null;
  dailyCalories?: number | null;
  proteinTarget?: number | null;
  carbsTarget?: number | null;
  fatsTarget?: number | null;
  bodyPlan?: {
    weeklyGainTarget?: number;
    workoutProgram?: string;
    dietPlan?: string;
    dietNotes?: string;
  };
  salary?: number | null;
  targetSalary?: number | null;
  currentYear: string;
  onboarded: boolean;
  avatarUrl?: string | null;
  role?: "user" | "admin";
  timezone?: string;
  language?: string;
  bio?: string | null;
}

interface LifeOSData {
  profile: Profile;
  years: string[];
  currentYear: string;
  yearData: YearPayload;
  dashboard?: DashboardSnapshot | null;
}

interface LifeOSContextValue {
  data: LifeOSData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Reload data without skeleton flash */
  refreshSilent: () => Promise<void>;
  /** Patch in-memory year data (optimistic UI) */
  patchYearData: (updater: (year: YearPayload) => YearPayload) => void;
  /** @deprecated Phase 0.5 — use entity APIs + refresh() */
  saveYear: (yearData: YearPayload, year?: string) => Promise<void>;
  setCurrentYear: (year: string) => Promise<void>;
}

const LifeOSContext = createContext<LifeOSContextValue | null>(null);

export function LifeOSProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LifeOSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (withLoading: boolean) => {
    if (withLoading) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch("/api/data");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof json.error === "string" ? json.error : "فشل تحميل البيانات"
        );
      }
      setData(json);
    } catch (e) {
      if (withLoading) {
        setError(e instanceof Error ? e.message : "تعذّر الاتصال بالخادم");
      }
    } finally {
      if (withLoading) setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => fetchData(true), [fetchData]);
  const refreshSilent = useCallback(() => fetchData(false), [fetchData]);

  const patchYearData = useCallback(
    (updater: (year: YearPayload) => YearPayload) => {
      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, yearData: updater(prev.yearData) };
      });
    },
    []
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveYear = useCallback(async () => {
    throw new Error("saveYear deprecated — use entity APIs (/api/tasks, /api/body, etc.) then refresh()");
  }, []);

  const setCurrentYear = useCallback(
    async (year: string) => {
      await fetch("/api/data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentYear: year }),
      });
      await refreshSilent();
    },
    [refreshSilent]
  );

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
      refresh,
      refreshSilent,
      patchYearData,
      saveYear,
      setCurrentYear,
    }),
    [data, loading, error, refresh, refreshSilent, patchYearData, saveYear, setCurrentYear]
  );

  return (
    <LifeOSContext.Provider value={value}>{children}</LifeOSContext.Provider>
  );
}

export function useLifeOS() {
  const ctx = useContext(LifeOSContext);
  if (!ctx) {
    throw new Error("useLifeOS must be used within LifeOSProvider");
  }
  return ctx;
}
