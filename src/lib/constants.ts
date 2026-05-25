import type { NavPage } from "@/types/lifeos";

export const DEFAULT_RULES = [
  "1️⃣ الاستمرارية فوق الكمال — 60% لسنة > 100% لأسبوع",
  "2️⃣ النوم أولاً — نوم أقل من 7 ساعات = خسارة 30% من الأداء",
  "3️⃣ ادفع لنفسك أولاً — ادخر يوم الراتب قبل أي شيء",
  "4️⃣ Deep Work يومي — ساعة تركيز > 5 ساعات متشتتة",
  "5️⃣ قارن نفسك بالأمس فقط",
  "6️⃣ لا تكسر السلسلة — Never Miss Twice",
  "7️⃣ المراجعة الأسبوعية مقدسة",
];

export const NAV_PAGES: NavPage[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    icon: "🏠",
    title: "لوحة التحكم",
    sub: "مركز التحكم الرئيسي",
    section: "الرئيسية",
  },
  {
    id: "identity",
    href: "/identity",
    icon: "🌟",
    title: "الهوية والرؤية",
    sub: "من أنت وإلى أين تسير",
    section: "الرئيسية",
  },
  {
    id: "goals",
    href: "/goals",
    icon: "🎯",
    title: "الأهداف والمهام",
    sub: "أهدافك مقسمة إلى مهام قابلة للتنفيذ",
    section: "التطوير",
  },
  {
    id: "habits",
    href: "/habits",
    icon: "⚡",
    title: "تتبع العادات",
    sub: "بناء الشخصية الجديدة يوماً بيوم",
    section: "التطوير",
  },
  {
    id: "analysis",
    href: "/analysis",
    icon: "📊",
    title: "التحليل الذكي",
    sub: "أنماط السلوك والعلاقات بين المتغيرات",
    section: "التطوير",
  },
  {
    id: "weight",
    href: "/weight",
    icon: "⚖️",
    title: "الوزن والقياسات",
    sub: "تتبع التحول الجسدي",
    section: "الجسد",
  },
  {
    id: "training",
    href: "/training",
    icon: "🏋️",
    title: "التمرين",
    sub: "نظام PPLUL — تتبع الأداء والتقدم",
    section: "الجسد",
  },
  {
    id: "nutrition",
    href: "/nutrition",
    icon: "🍽️",
    title: "التغذية",
    sub: "3000 سعرة — توزيع الماكروز",
    section: "الجسد",
  },
  {
    id: "books",
    href: "/books",
    icon: "📚",
    title: "المكتبة",
    sub: "12 كتاب/سنة — متابعة تقدم القراءة",
    section: "العقل والمال",
  },
  {
    id: "finance",
    href: "/finance",
    icon: "💰",
    title: "المالية",
    sub: "ادخار · ميزانية · أقساط",
    section: "العقل والمال",
  },
  {
    id: "career",
    href: "/career",
    icon: "📈",
    title: "المهنة",
    sub: "خارطة التحول إلى Financial Analyst",
    section: "العقل والمال",
  },
  {
    id: "timeblock",
    href: "/timeblock",
    icon: "⏰",
    title: "Time Blocking",
    sub: "تخطيط الأسبوع ومتابعة التنفيذ",
    section: "الإنتاجية",
  },
  {
    id: "pomodoro",
    href: "/pomodoro",
    icon: "🍅",
    title: "Pomodoro",
    sub: "جلسات التركيز العميق",
    section: "الإنتاجية",
  },
  {
    id: "review",
    href: "/review",
    icon: "🔄",
    title: "المراجعات",
    sub: "أسبوعية · شهرية · ربع سنوية",
    section: "الإنتاجية",
  },
  {
    id: "archive",
    href: "/archive",
    icon: "🗃️",
    title: "الأرشيف السنوي",
    sub: "حفظ البيانات ومقارنة السنوات",
    section: "الإنتاجية",
  },
];

export function getPageMeta(pathname: string) {
  const page = NAV_PAGES.find((p) => pathname.startsWith(p.href));
  return page ?? NAV_PAGES[0];
}
