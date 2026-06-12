"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import type { AreaHubPayload } from "@/types/areas";

async function fetchAreaHub(slug: string): Promise<AreaHubPayload> {
  const res = await fetch(`/api/areas/${slug}`);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.area) throw new Error("المجال غير موجود");
  return json as AreaHubPayload;
}

export function useAreaHub(slug: string) {
  return useQuery({
    queryKey: queryKeys.areaHub(slug),
    queryFn: () => fetchAreaHub(slug),
    staleTime: 90_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
    enabled: Boolean(slug),
  });
}
