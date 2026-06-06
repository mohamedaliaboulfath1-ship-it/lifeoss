import type { LifeDomain, LifeDomainId } from "@/types/lifeos-pro";

/** System life domains — mirrored from DB seed (life_domains) */
export const SYSTEM_DOMAINS: LifeDomain[] = [
  { id: "domain_body", slug: "body", nameEn: "Body", nameAr: "الجسد", icon: "💪", color: "#2dd4bf", sortOrder: 1, scoreWeight: 1.2, isSystem: true },
  { id: "domain_finance", slug: "finance", nameEn: "Finance", nameAr: "المال", icon: "💰", color: "#fbbf24", sortOrder: 2, scoreWeight: 1.1, isSystem: true },
  { id: "domain_career", slug: "career", nameEn: "Career", nameAr: "المهنة", icon: "📈", color: "#60a5fa", sortOrder: 3, scoreWeight: 1.15, isSystem: true },
  { id: "domain_learning", slug: "learning", nameEn: "Learning", nameAr: "التعلم", icon: "🧠", color: "#a78bfa", sortOrder: 4, scoreWeight: 1.1, isSystem: true },
  { id: "domain_relationships", slug: "relationships", nameEn: "Relationships", nameAr: "العلاقات", icon: "🤝", color: "#f472b6", sortOrder: 5, scoreWeight: 0.9, isSystem: true },
  { id: "domain_spiritual", slug: "spiritual", nameEn: "Spiritual", nameAr: "الروح", icon: "🕌", color: "#34d399", sortOrder: 6, scoreWeight: 1.0, isSystem: true },
  { id: "domain_self_dev", slug: "self_development", nameEn: "Self Development", nameAr: "التطوير الذاتي", icon: "⚡", color: "#fb923c", sortOrder: 7, scoreWeight: 1.0, isSystem: true },
  { id: "domain_discipline", slug: "discipline", nameEn: "Discipline", nameAr: "الانضباط", icon: "🎯", color: "#e879f9", sortOrder: 8, scoreWeight: 1.25, isSystem: true },
];

const LEGACY_CATEGORY_MAP: Record<string, LifeDomainId> = {
  health: "domain_body",
  body: "domain_body",
  finance: "domain_finance",
  career: "domain_career",
  learning: "domain_learning",
  relationships: "domain_relationships",
  spiritual: "domain_spiritual",
  self_dev: "domain_self_dev",
  self: "domain_self_dev",
  discipline: "domain_discipline",
  mind: "domain_learning",
  relation: "domain_relationships",
  spirit: "domain_spiritual",
  prod: "domain_discipline",
};

export function resolveDomainId(category?: string | null): LifeDomainId {
  if (!category) return "domain_self_dev";
  return LEGACY_CATEGORY_MAP[category.toLowerCase().trim()] ?? "domain_self_dev";
}

export function getDomainById(id: string): LifeDomain | undefined {
  return SYSTEM_DOMAINS.find((d) => d.id === id);
}

/** Default time horizon per goal level */
export const DEFAULT_HORIZON_BY_LEVEL = {
  vision: "horizon_life_vision",
  goal: "horizon_annual",
  project: "horizon_quarterly",
} as const;
