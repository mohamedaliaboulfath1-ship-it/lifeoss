export const queryKeys = {
  lifeos: ["lifeos-data"] as const,
  areasOverview: ["areas-overview"] as const,
  areaHub: (slug: string) => ["area-hub", slug] as const,
  journal: (id: string) => ["journal-entry", id] as const,
  journalList: ["journal-list"] as const,
  journalGraph: ["journal-graph"] as const,
  analytics: ["analytics"] as const,
};
