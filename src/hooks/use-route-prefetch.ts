"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";

const CHUNK_PREFETCH: Record<string, () => Promise<unknown>> = {
  "/dashboard": () => import("@/components/dashboard/dashboard-view"),
  "/habits": () => import("@/components/habits/habits-para-view"),
  "/analytics": () => import("@/components/dashboard/analytics-view"),
  "/finance": () => import("@/components/finance/wealth-finance-view"),
  "/executive": () => import("@/components/dashboard/executive-view"),
  "/life-map": () => import("@/components/life-map/life-map-view"),
};

async function fetchAreasOverview() {
  const res = await fetch("/api/areas/overview");
  if (!res.ok) throw new Error("prefetch failed");
  return res.json();
}

export function useRoutePrefetch() {
  const queryClient = useQueryClient();

  return useCallback(
    (href: string) => {
      const path = href.split("?")[0];
      const chunk = CHUNK_PREFETCH[path];
      if (chunk) void chunk();

      if (path === "/areas" || path.startsWith("/areas/")) {
        void queryClient.prefetchQuery({
          queryKey: queryKeys.areasOverview,
          queryFn: fetchAreasOverview,
          staleTime: 90_000,
        });
      }
    },
    [queryClient]
  );
}
