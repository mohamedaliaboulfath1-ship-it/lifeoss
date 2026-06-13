import type { JournalBlock, JournalBlockType } from "@/types/journal";
import { uid } from "@/lib/utils";

export const JOURNAL_CATEGORIES = [
  { id: "journal", label: "يوميات", icon: "📔" },
  { id: "personal", label: "شخصي", icon: "🧘" },
  { id: "career", label: "مهنة", icon: "📈" },
  { id: "finance", label: "مال", icon: "💰" },
  { id: "learning", label: "تعلّم", icon: "🧠" },
  { id: "books", label: "كتب", icon: "📚" },
  { id: "ideas", label: "أفكار", icon: "💡" },
  { id: "projects", label: "مشاريع", icon: "📁" },
  { id: "research", label: "بحث", icon: "🔬" },
] as const;

export const SLASH_COMMANDS: {
  id: JournalBlockType;
  label: string;
  icon: string;
  keywords: string[];
}[] = [
  { id: "heading1", label: "عنوان 1", icon: "H1", keywords: ["heading1", "h1", "عنوان"] },
  { id: "heading2", label: "عنوان 2", icon: "H2", keywords: ["heading2", "h2"] },
  { id: "heading3", label: "عنوان 3", icon: "H3", keywords: ["heading3", "h3"] },
  { id: "text", label: "نص", icon: "¶", keywords: ["text", "نص", "فقرة"] },
  { id: "checklist", label: "قائمة مهام", icon: "☑", keywords: ["checklist", "todo", "مهام"] },
  { id: "bullet", label: "نقاط", icon: "•", keywords: ["bullet", "list", "نقاط"] },
  { id: "numbered", label: "مرقّمة", icon: "1.", keywords: ["numbered", "ordered"] },
  { id: "quote", label: "اقتباس", icon: "❝", keywords: ["quote", "اقتباس"] },
  { id: "callout", label: "تنبيه", icon: "💡", keywords: ["callout", "تنبيه"] },
  { id: "divider", label: "فاصل", icon: "—", keywords: ["divider", "line", "فاصل"] },
  { id: "code", label: "كود", icon: "</>", keywords: ["code", "كود"] },
  { id: "table", label: "جدول", icon: "⊞", keywords: ["table", "جدول"] },
  { id: "toggle", label: "قابل للطي", icon: "▸", keywords: ["toggle", "fold"] },
  { id: "image", label: "صورة", icon: "🖼", keywords: ["image", "صورة"] },
  { id: "video", label: "فيديو", icon: "▶", keywords: ["video", "فيديو"] },
  { id: "embed", label: "تضمين", icon: "🔗", keywords: ["embed", "رابط"] },
  { id: "book", label: "كتاب", icon: "📚", keywords: ["book", "كتاب"] },
  { id: "task", label: "مهمة", icon: "✅", keywords: ["task", "مهمة"] },
  { id: "project", label: "مشروع", icon: "📁", keywords: ["project", "مشروع"] },
  { id: "goal", label: "هدف", icon: "🎯", keywords: ["goal", "هدف"] },
  { id: "habit", label: "عادة", icon: "🔄", keywords: ["habit", "عادة"] },
  { id: "date", label: "تاريخ", icon: "📅", keywords: ["date", "تاريخ"] },
];

export function createBlock(type: JournalBlockType, content = "", sortOrder = 0): JournalBlock {
  const base: JournalBlock = {
    id: uid(),
    type,
    content,
    sortOrder,
    metadata: {},
  };
  if (type === "checklist") base.checked = false;
  if (type === "bullet" || type === "numbered") base.items = [""];
  if (type === "table") {
    base.metadata = { rows: 2, cols: 2, cells: [["", ""], ["", ""]] };
  }
  if (type === "toggle") base.children = [];
  if (type === "date") base.content = new Date().toISOString().slice(0, 10);
  return base;
}

export function blocksFromTemplate(raw: Partial<JournalBlock>[]): JournalBlock[] {
  return raw.map((b, i) => ({
    id: uid(),
    type: (b.type ?? "text") as JournalBlockType,
    content: b.content ?? "",
    sortOrder: i,
    checked: b.checked,
    items: b.items ? [...b.items] : undefined,
    children: b.children?.map((c, j) => ({
      ...createBlock(c.type as JournalBlockType, c.content ?? "", j),
      ...c,
      id: uid(),
    })),
    metadata: b.metadata ?? {},
  }));
}

export function defaultBlocks(): JournalBlock[] {
  return [createBlock("text", "", 0)];
}

export function extractPlainText(blocks: JournalBlock[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.content) parts.push(b.content.replace(/<[^>]+>/g, ""));
    if (b.items) parts.push(...b.items);
    if (b.children) parts.push(extractPlainText(b.children));
  }
  return parts.join(" ");
}

export function calcWordCount(blocks: JournalBlock[]): number {
  const text = extractPlainText(blocks).trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function calcReadingTimeMin(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function filterSlashCommands(query: string) {
  const q = query.toLowerCase().replace(/^\//, "");
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (c) =>
      c.id.includes(q) ||
      c.label.includes(q) ||
      c.keywords.some((k) => k.includes(q))
  );
}
