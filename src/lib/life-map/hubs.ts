import type { LifeMapNode } from "./types";

/** Branch hubs radiating from LIFEOS center */
export const LIFE_MAP_HUBS: LifeMapNode[] = [
  { id: "hub_body", type: "area", label: "BODY", icon: "💪", color: "#2dd4bf", domainSlug: "body", domainId: "domain_body" },
  { id: "hub_career", type: "area", label: "CAREER", icon: "📈", color: "#60a5fa", domainSlug: "career", domainId: "domain_career" },
  { id: "hub_finance", type: "area", label: "FINANCE", icon: "💰", color: "#fbbf24", domainSlug: "finance", domainId: "domain_finance" },
  { id: "hub_learning", type: "area", label: "LEARNING", icon: "🧠", color: "#a78bfa", domainSlug: "learning", domainId: "domain_learning" },
  { id: "hub_books", type: "area", label: "BOOKS", icon: "📚", color: "#c084fc", domainSlug: "learning" },
  { id: "hub_health", type: "area", label: "HEALTH", icon: "❤️", color: "#34d399", domainSlug: "body", domainId: "domain_body" },
  { id: "hub_soul", type: "area", label: "SOUL", icon: "🕌", color: "#6ee7b7", domainSlug: "spiritual", domainId: "domain_spiritual" },
  { id: "hub_projects", type: "area", label: "PROJECTS", icon: "📁", color: "#38bdf8" },
  { id: "hub_goals", type: "area", label: "GOALS", icon: "🎯", color: "#f59e0b" },
  { id: "hub_habits", type: "area", label: "HABITS", icon: "🔄", color: "#10b981" },
  { id: "hub_tasks", type: "area", label: "TASKS", icon: "✅", color: "#f97316" },
  { id: "hub_resources", type: "area", label: "RESOURCES", icon: "📦", color: "#94a3b8" },
];

export const CENTER_NODE_ID = "lifeos_center";

export const DOMAIN_TO_HUB: Record<string, string> = {
  domain_body: "hub_body",
  domain_finance: "hub_finance",
  domain_career: "hub_career",
  domain_learning: "hub_learning",
  domain_relationships: "hub_soul",
  domain_spiritual: "hub_soul",
  domain_self_dev: "hub_learning",
  domain_discipline: "hub_habits",
};

export const TYPE_TO_HUB: Record<string, string> = {
  vision: "hub_goals",
  goal: "hub_goals",
  project: "hub_projects",
  task: "hub_tasks",
  habit: "hub_habits",
  book: "hub_books",
  skill: "hub_learning",
  course: "hub_learning",
  cert: "hub_career",
  resource: "hub_resources",
  learning_path: "hub_learning",
  weight: "hub_body",
  finance: "hub_finance",
};
