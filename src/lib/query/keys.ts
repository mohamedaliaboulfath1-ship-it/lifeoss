export const queryKeys = {
  lifeos: ["lifeos-data"] as const,
  areasOverview: ["areas-overview"] as const,
  areaHub: (slug: string) => ["area-hub", slug] as const,
  lifeMap: ["life-map"] as const,
  analytics: ["analytics"] as const,
};
