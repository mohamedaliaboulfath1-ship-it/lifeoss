"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import type { AreasOverviewResponse } from "@/types/areas";

async function fetchAreasOverview(): Promise<AreasOverviewResponse> {
  const res = await fetch("/api/areas/overview");
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error("فشل تحميل المجالات");
  return {
    previews: json?.previews ?? [],
    stats: json?.stats ?? {
      lifeScore: 0,
      activeGoals: 0,
      activeProjects: 0,
      habits: 0,
      tasksThisWeek: 0,
      areasNeedingAttention: 0,
    },
  };
}

export function useAreasOverview() {
  return useQuery({
    queryKey: queryKeys.areasOverview,
    queryFn: fetchAreasOverview,
    staleTime: 90_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  });
}
