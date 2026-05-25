"use client";

import { useCallback, useEffect, useState } from "react";
import type { YearPayload } from "@/types/lifeos";

interface Profile {
  displayName: string;
  city?: string | null;
  age?: number | null;
  height?: number | null;
  startWeight?: number | null;
  targetWeight?: number | null;
  salary?: number | null;
  targetSalary?: number | null;
  currentYear: string;
  onboarded: boolean;
}

interface LifeOSData {
  profile: Profile | null;
  years: string[];
  currentYear: string;
  yearData: YearPayload;
}

export function useLifeOSData() {
  const [data, setData] = useState<LifeOSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      setError(e instanceof Error ? e.message : "تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveYear = useCallback(
    async (yearData: YearPayload, year?: string) => {
      const y = year ?? data?.currentYear;
      if (!y) return;
      const res = await fetch("/api/year", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: y, data: yearData }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      await refresh();
    },
    [data?.currentYear, refresh]
  );

  const setCurrentYear = useCallback(
    async (year: string) => {
      await fetch("/api/data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentYear: year }),
      });
      await refresh();
    },
    [refresh]
  );

  return { data, loading, error, refresh, saveYear, setCurrentYear };
}
