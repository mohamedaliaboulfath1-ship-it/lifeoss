import type { JournalTemplate } from "@/types/journal";

/** Built-in templates — used when DB system templates are missing */
export const JOURNAL_SYSTEM_TEMPLATES: JournalTemplate[] = [
  {
    id: "tpl_daily_review",
    name: "مراجعة يومية",
    category: "journal",
    description: "Daily Review — ماذا أنجزت؟ ما الذي عطّلك؟",
    blocks: [
      { type: "heading2", content: "ماذا أنجزت اليوم؟" },
      { type: "text", content: "" },
      { type: "heading2", content: "ما الذي عطّلني؟" },
      { type: "text", content: "" },
      { type: "heading2", content: "ماذا تعلّمت؟" },
      { type: "text", content: "" },
      { type: "heading2", content: "أولوية الغد" },
      { type: "checklist", content: "مهمة 1", checked: false },
    ],
    isSystem: true,
  },
  {
    id: "tpl_weekly_review",
    name: "مراجعة أسبوعية",
    category: "journal",
    description: "Weekly Review",
    blocks: [
      { type: "heading2", content: "انتصارات الأسبوع" },
      { type: "bullet", content: "", items: ["", ""] },
      { type: "heading2", content: "إخفاقات / دروس" },
      { type: "text", content: "" },
      { type: "heading2", content: "خطة الأسبوع القادم" },
      { type: "numbered", content: "", items: ["", "", ""] },
    ],
    isSystem: true,
  },
  {
    id: "tpl_monthly_review",
    name: "مراجعة شهرية",
    category: "journal",
    description: "Monthly Review — صحة · مال · مهنة · تعلّم",
    blocks: [
      { type: "heading2", content: "الصحة" },
      { type: "text", content: "" },
      { type: "heading2", content: "المال" },
      { type: "text", content: "" },
      { type: "heading2", content: "المهنة" },
      { type: "text", content: "" },
      { type: "heading2", content: "التعلّم" },
      { type: "text", content: "" },
      { type: "heading2", content: "العلاقات" },
      { type: "text", content: "" },
    ],
    isSystem: true,
  },
];

export function getSystemTemplate(id: string) {
  return JOURNAL_SYSTEM_TEMPLATES.find((t) => t.id === id);
}

export function isJournalMigrationError(message: string) {
  return (
    message.includes("does not exist") ||
    message.includes("journal_entries") ||
    message.includes("journal_blocks")
  );
}
