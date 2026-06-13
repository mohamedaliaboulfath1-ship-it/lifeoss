"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass";
import { cn } from "@/lib/utils";
import { startTour, TOUR_IDS } from "@/lib/tours/driver-tours";
import { Button } from "@/components/ui/button";

const SECTIONS: {
  id: string;
  title: string;
  icon: string;
  content: string;
  tour?: (typeof TOUR_IDS)[keyof typeof TOUR_IDS];
}[] = [
  {
    id: "start",
    title: "البداية",
    icon: "🚀",
    content: `LifeOS نظام تشغيل حياتك الشخصي — يجمع الأهداف، العادات، المهام، المال، الجسد، والتعلّم في مكان واحد.

**الهيكل الأساسي (PARA):**
- **المجالات (Areas):** مناطق حياتك الدائمة
- **المشاريع (Projects):** مخرجات محددة بموعد
- **الموارد (Resources):** مراجع وروابط
- **الأرشيف (Archive):** ما انتهى`,
  },
  {
    id: "goals",
    title: "الأهداف والمشاريع",
    icon: "🎯",
    content: `حوّل الرؤية إلى أهداف قابلة للقياس:
- مستويات: رؤية → هدف → مشروع
- ربط المهام والعادات بالهدف
- تتبع التقدّم بالنسبة المئوية
- مراجعة أسبوعية للأولويات`,
    tour: TOUR_IDS.goals,
  },
  {
    id: "habits",
    title: "العادات",
    icon: "🔄",
    content: `العادات هي محرك التغيير:
- تكرار يومي/أسبوعي
- سلاسل (Streaks) و Never Miss Twice
- ربط بالأهداف والمشاريع
- تأثير على Life Score`,
    tour: TOUR_IDS.habits,
  },
  {
    id: "tasks",
    title: "المهام",
    icon: "✅",
    content: `نظام 3 مهام كبيرة يومياً:
- أولويات: عالية / متوسطة / منخفضة
- ربط بالأهداف والمشاريع
- Kanban وتصفية حسب الحالة`,
  },
  {
    id: "body",
    title: "الجسد والتغذية",
    icon: "💪",
    content: `**الوزن:** تتبع يومي ورسوم بيانية
**التغذية:** سعرات وماكروز
**التمارين:** نظام PPLUL
**صور التقدّم:** مقارنة بصرية`,
  },
  {
    id: "learning",
    title: "التعلّم والمكتبة",
    icon: "📚",
    content: `**المكتبة:** كتب بحالات (مخطط / قراءة / منتهي)
**Learning Hub:** مسارات دراسية وجلسات
**Career Hub:** مهارات وشهادات ومسار مهني`,
  },
  {
    id: "finance",
    title: "المال",
    icon: "💰",
    content: `**المعاملات:** دخل ومصروف
**الميزانية:** فئات وتتبع
**الثروة:** استثمارات وصافي الثروة
**الادخار:** أهداف ادخار`,
  },
  {
    id: "reviews",
    title: "المراجعات",
    icon: "📔",
    content: `**يومية:** 5 دقائق — ماذا نجح؟
**أسبوعية:** مراجعة الأهداف والعادات
**شهرية:** تقييم شامل واتجاهات`,
  },
  {
    id: "life-map",
    title: "خريطة الحياة",
    icon: "🗺️",
    content: `رؤية بصرية لروابط:
الرؤية ← الأهداف ← المشاريع ← العادات ← المهام`,
    tour: TOUR_IDS.lifeMap,
  },
];

export default function GuidePage() {
  const [active, setActive] = useState(SECTIONS[0]!.id);
  const section = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0]!;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8" data-tour="main-content">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-black text-gold2 mb-2">
            📖 مركز المساعدة
          </h1>
          <p className="text-text2 text-sm">
            دليل شامل لكل وحدات LifeOS — مع جولات تفاعلية.
          </p>
        </header>

        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  "w-full text-right px-4 py-2.5 rounded-lg text-sm transition-colors",
                  active === s.id
                    ? "bg-gold/15 text-gold2 font-bold"
                    : "text-text2 hover:bg-surface2"
                )}
              >
                {s.icon} {s.title}
              </button>
            ))}
          </nav>

          <GlassCard className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4">
              {section.icon} {section.title}
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-text2 whitespace-pre-line leading-relaxed">
              {section.content}
            </div>
            {"tour" in section && section.tour ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-6"
                onClick={() => startTour(section.tour!)}
              >
                ابدأ الجولة التفاعلية
              </Button>
            ) : null}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
