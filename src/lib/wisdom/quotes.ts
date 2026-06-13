export type WisdomCategory =
  | "leadership"
  | "discipline"
  | "productivity"
  | "learning"
  | "finance"
  | "growth";

export interface WisdomQuote {
  id: string;
  text: string;
  author: string;
  category: WisdomCategory;
  summary?: string;
}

export const WISDOM_CATEGORIES: { id: WisdomCategory; label: string; icon: string }[] = [
  { id: "leadership", label: "قيادة", icon: "👑" },
  { id: "discipline", label: "انضباط", icon: "🎯" },
  { id: "productivity", label: "إنتاجية", icon: "⚡" },
  { id: "learning", label: "تعلّم", icon: "📚" },
  { id: "finance", label: "مال", icon: "💰" },
  { id: "growth", label: "نمو شخصي", icon: "🌱" },
];

/** Public-domain and original summaries — short quotes only */
export const WISDOM_QUOTES: WisdomQuote[] = [
  {
    id: "l1",
    text: "القيادة هي القدرة على ترجمة الرؤية إلى واقع.",
    author: "ملخص LifeOS",
    category: "leadership",
    summary: "القائد يوضّح الاتجاه ثم يمكّن الفريق من الوصول.",
  },
  {
    id: "l2",
    text: "Know thyself.",
    author: "Socrates (public domain)",
    category: "leadership",
    summary: "معرفة نقاط قوتك وضعفك أساس القرار الجيد.",
  },
  {
    id: "d1",
    text: "الانضباط هو الجسر بين الأهداف والإنجاز.",
    author: "ملخص LifeOS",
    category: "discipline",
  },
  {
    id: "d2",
    text: "We are what we repeatedly do.",
    author: "Aristotle (attributed, public domain)",
    category: "discipline",
    summary: "التميز ليس فعلاً بل عادة.",
  },
  {
    id: "p1",
    text: "ركّز على المهم، لا على المستعجل.",
    author: "ملخص LifeOS",
    category: "productivity",
  },
  {
    id: "p2",
    text: "Lost time is never found again.",
    author: "Benjamin Franklin (public domain)",
    category: "productivity",
  },
  {
    id: "e1",
    text: "اقرأ كتاباً جيداً كل شهر — العقل مثل العضلة.",
    author: "ملخص LifeOS",
    category: "learning",
  },
  {
    id: "e2",
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin (public domain)",
    category: "learning",
  },
  {
    id: "f1",
    text: "ادفع لنفسك أولاً — الادخار عادة قبل الإنفاق.",
    author: "ملخص LifeOS",
    category: "finance",
  },
  {
    id: "f2",
    text: "Beware of little expenses; a small leak will sink a great ship.",
    author: "Benjamin Franklin (public domain)",
    category: "finance",
  },
  {
    id: "g1",
    text: "قارن نفسك بالأمس فقط — التقدّم الحقيقي داخلي.",
    author: "ملخص LifeOS",
    category: "growth",
  },
  {
    id: "g2",
    text: "What we think, we become.",
    author: "Buddha (public domain)",
    category: "growth",
  },
];

export function getDailyQuote(date = new Date()): WisdomQuote {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return WISDOM_QUOTES[dayOfYear % WISDOM_QUOTES.length]!;
}

export function getQuotesByCategory(category: WisdomCategory): WisdomQuote[] {
  return WISDOM_QUOTES.filter((q) => q.category === category);
}
