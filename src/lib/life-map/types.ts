export type LifeMapNodeType =
  | "center"
  | "area"
  | "vision"
  | "goal"
  | "project"
  | "task"
  | "habit"
  | "book"
  | "skill"
  | "course"
  | "cert"
  | "resource"
  | "learning_path"
  | "weight"
  | "finance";

export type LifeMapEdgeKind = "hub" | "parent" | "linked" | "domain";

export type LifeMapNodeStatus = "normal" | "completed" | "at_risk" | "locked";

export type LifeMapRiskLevel = "low" | "medium" | "high";

export interface LifeMapNode {
  id: string;
  type: LifeMapNodeType;
  label: string;
  progress?: number;
  healthScore?: number;
  riskLevel?: LifeMapRiskLevel;
  trend?: "up" | "down" | "stable";
  status?: LifeMapNodeStatus;
  domainId?: string;
  domainSlug?: string;
  hubId?: string;
  href?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface LifeMapEdge {
  from: string;
  to: string;
  kind?: LifeMapEdgeKind;
  weight?: number;
}

export interface LifeMapAreaHealth {
  domainId: string;
  slug: string;
  nameAr: string;
  icon: string;
  color: string;
  healthScore: number;
  trend: "up" | "down" | "stable";
  riskLevel: LifeMapRiskLevel;
}

export interface LifeMapPayload {
  nodes: LifeMapNode[];
  edges: LifeMapEdge[];
  areaHealth: LifeMapAreaHealth[];
  stats: {
    visions: number;
    goals: number;
    projects: number;
    tasks: number;
    habits: number;
    books: number;
    skills: number;
    courses: number;
    certs: number;
    resources: number;
    learningPaths: number;
  };
}
