"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { BodyGoal } from "@/components/body/body-plan-panel";
import type { YearPayload } from "@/types/lifeos";
import type { DashboardSnapshot } from "@/types/lifeos-pro";
import { queryKeys } from "@/lib/query/keys";

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
    bodyGoal?: BodyGoal;
  };
  weight?: number | null;
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

export interface LifeOSData {
  profile: Profile;
  years: string[];
  currentYear: string;
  yearData: YearPayload;
  dashboard?: DashboardSnapshot | null;
}

interface LifeOSActions {
  refresh: () => Promise<void>;
  refreshSilent: () => Promise<void>;
  patchYearData: (updater: (year: YearPayload) => YearPayload) => void;
  saveYear: (yearData: YearPayload, year?: string) => Promise<void>;
  setCurrentYear: (year: string) => Promise<void>;
}

interface LifeOSDataState {
  data: LifeOSData | null;
  loading: boolean;
  error: string | null;
}

const LifeOSDataContext = createContext<LifeOSDataState | null>(null);
const LifeOSActionsContext = createContext<LifeOSActions | null>(null);

async function fetchLifeOSData(): Promise<LifeOSData> {
  const res = await fetch("/api/data");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof json.error === "string" ? json.error : "فشل تحميل البيانات");
  }
  return json as LifeOSData;
}

export function LifeOSProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.lifeos,
    queryFn: fetchLifeOSData,
    staleTime: 45_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
    refetchOnMount: false,
  });

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const refreshSilent = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.lifeos, refetchType: "none" });
    await queryClient.fetchQuery({
      queryKey: queryKeys.lifeos,
      queryFn: fetchLifeOSData,
      staleTime: 0,
    });
  }, [queryClient]);

  const patchYearData = useCallback(
    (updater: (year: YearPayload) => YearPayload) => {
      queryClient.setQueryData<LifeOSData>(queryKeys.lifeos, (prev) => {
        if (!prev) return prev;
        return { ...prev, yearData: updater(prev.yearData) };
      });
    },
    [queryClient]
  );

  const saveYear = useCallback(async () => {
    throw new Error("saveYear deprecated — use entity APIs then refresh()");
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

  const dataState = useMemo<LifeOSDataState>(
    () => ({
      data: data ?? null,
      loading: isLoading && !data,
      error: error instanceof Error ? error.message : error ? String(error) : null,
    }),
    [data, isLoading, error]
  );

  const actions = useMemo<LifeOSActions>(
    () => ({
      refresh,
      refreshSilent,
      patchYearData,
      saveYear,
      setCurrentYear,
    }),
    [refresh, refreshSilent, patchYearData, saveYear, setCurrentYear]
  );

  return (
    <LifeOSActionsContext.Provider value={actions}>
      <LifeOSDataContext.Provider value={dataState}>
        {children}
        {isFetching && data ? (
          <span className="sr-only" aria-live="polite">
            جاري تحديث البيانات
          </span>
        ) : null}
      </LifeOSDataContext.Provider>
    </LifeOSActionsContext.Provider>
  );
}

export function useLifeOSData() {
  const ctx = useContext(LifeOSDataContext);
  if (!ctx) throw new Error("useLifeOSData must be used within LifeOSProvider");
  return ctx;
}

export function useLifeOSActions() {
  const ctx = useContext(LifeOSActionsContext);
  if (!ctx) throw new Error("useLifeOSActions must be used within LifeOSProvider");
  return ctx;
}

/** @deprecated Prefer useLifeOSData + useLifeOSActions for fewer rerenders */
export function useLifeOS() {
  const { data, loading, error } = useLifeOSData();
  const actions = useLifeOSActions();
  return useMemo(
    () => ({ data, loading, error, ...actions }),
    [data, loading, error, actions]
  );
}
