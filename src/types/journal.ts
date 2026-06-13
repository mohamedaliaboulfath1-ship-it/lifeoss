export type JournalCategory =
  | "personal"
  | "career"
  | "finance"
  | "learning"
  | "books"
  | "ideas"
  | "projects"
  | "research"
  | "journal";

export type JournalBlockType =
  | "heading1"
  | "heading2"
  | "heading3"
  | "text"
  | "checklist"
  | "bullet"
  | "numbered"
  | "quote"
  | "callout"
  | "divider"
  | "code"
  | "table"
  | "toggle"
  | "image"
  | "video"
  | "embed"
  | "book"
  | "task"
  | "project"
  | "goal"
  | "habit"
  | "date"
  | "mention";

export type JournalRelationType = "goal" | "project" | "task" | "book" | "habit" | "area";

export interface JournalBlock {
  id: string;
  type: JournalBlockType;
  content: string;
  sortOrder: number;
  parentId?: string | null;
  checked?: boolean;
  items?: string[];
  children?: JournalBlock[];
  metadata?: Record<string, unknown>;
}

export interface JournalRelation {
  id: string;
  entryId: string;
  blockId?: string | null;
  targetType: JournalRelationType;
  targetId: string;
  label?: string;
}

export interface JournalImage {
  id: string;
  entryId: string;
  blockId?: string | null;
  storagePath: string;
  url?: string;
  caption?: string;
  sortOrder: number;
  fullWidth: boolean;
  metadata?: Record<string, unknown>;
}

export interface JournalEntry {
  id: string;
  title: string;
  subtitle?: string | null;
  author?: string | null;
  category: JournalCategory;
  coverImagePath?: string | null;
  coverUrl?: string | null;
  status: "draft" | "published" | "archived";
  isDaily: boolean;
  journalDate?: string | null;
  wordCount: number;
  readingTimeMin: number;
  tags: string[];
  blocks: JournalBlock[];
  relations: JournalRelation[];
  images: JournalImage[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntrySummary {
  id: string;
  title: string;
  subtitle?: string | null;
  category: JournalCategory;
  coverUrl?: string | null;
  status: string;
  isDaily: boolean;
  journalDate?: string | null;
  wordCount: number;
  readingTimeMin: number;
  tags: string[];
  updatedAt: string;
}

export interface JournalTemplate {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  blocks: Partial<JournalBlock>[];
  isSystem: boolean;
}

export interface MentionResult {
  id: string;
  type: JournalRelationType;
  label: string;
  href: string;
}

export type JournalAiAction =
  | "summarize"
  | "rewrite"
  | "expand"
  | "translate"
  | "extract_tasks"
  | "extract_goals"
  | "extract_habits"
  | "action_plan";

export interface JournalGraphNode {
  id: string;
  type: "note" | "book" | "goal" | "project" | "task" | "habit" | "area";
  label: string;
  href?: string;
  category?: string;
}

export interface JournalGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}
