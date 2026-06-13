import type { JournalAiAction, JournalBlock } from "@/types/journal";
import { extractPlainText } from "./blocks";

/** Rule-based AI stubs — ready for OpenAI provider swap */
export async function runJournalAi(
  action: JournalAiAction,
  blocks: JournalBlock[],
  title: string
): Promise<{ result: string; blocks?: JournalBlock[] }> {
  const text = extractPlainText(blocks);
  const preview = text.slice(0, 2000);

  switch (action) {
    case "summarize":
      return {
        result: text.length < 40
          ? "المحتوى قصير جداً للتلخيص."
          : `ملخص «${title}»:\n\n${preview.split(/\s+/).slice(0, 80).join(" ")}…`,
      };
    case "rewrite":
      return {
        result: `نسخة محسّنة:\n\n${preview.replace(/\./g, ".\n")}`,
      };
    case "expand":
      return {
        result: `${preview}\n\n— توسعة مقترحة: أضف أمثلة عملية وخطوات تنفيذ واضحة مرتبطة بأهدافك في LifeOS.`,
      };
    case "translate":
      return {
        result: `[EN draft]\n${preview}`,
      };
    case "extract_tasks": {
      const lines = preview
        .split(/[.\n]/)
        .map((l) => l.trim())
        .filter((l) => l.length > 8)
        .slice(0, 5);
      return {
        result: lines.length
          ? `مهام مقترحة:\n${lines.map((l, i) => `${i + 1}. ${l}`).join("\n")}`
          : "لم يُعثر على مهام واضحة — أضف المزيد من المحتوى.",
        blocks: lines.map((l, i) => ({
          id: `ai-task-${i}`,
          type: "checklist" as const,
          content: l,
          sortOrder: 900 + i,
          checked: false,
        })),
      };
    }
    case "extract_goals":
      return {
        result: `أهداف مقترحة من «${title}»:\n• هدف قصير المدى\n• هدف متوسط\n• مؤشر قياس`,
      };
    case "extract_habits":
      return {
        result: `عادات مقترحة:\n• مراجعة يومية 10 دقائق\n• تتبع أسبوعي\n• ربط بهدف رئيسي`,
      };
    case "action_plan":
      return {
        result: `خطة عمل:\n1. تحديد الأولوية\n2. ربط بمهمة في LifeOS\n3. جدولة في Time Planner\n4. مراجعة نهاية الأسبوع`,
      };
    default:
      return { result: "إجراء غير معروف" };
  }
}
