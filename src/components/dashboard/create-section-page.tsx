"use client";

import { SectionPlaceholder } from "@/components/dashboard/section-placeholder";
import { Topbar } from "@/components/layout/topbar";
import { getPageMeta } from "@/lib/constants";
import { usePathname } from "next/navigation";

const SECTION_FEATURES: Record<string, string[]> = {
  identity: [
    "صفات الهوية الجديدة",
    "قواعد الحياة السبعة",
    "جدول المعالم والمكافآت",
  ],
  analysis: [
    "تحليل أنماط العادات",
    "علاقة الوزن بالنوم والسعرات",
    "احتمالية تحقيق الأهداف",
  ],
  weight: [
    "سجل الوزن الأسبوعي",
    "قياسات الجسم (صدر، خصر، ذراع)",
    "رسوم بيانية للتقدم",
  ],
  training: [
    "نظام PPLUL",
    "تتبع المجموعات والأوزان",
    "حجم التمرين الأسبوعي",
  ],
  nutrition: [
    "هدف 3000 سعرة",
    "توزيع الماكروز",
    "متابعة يومية",
  ],
  books: [
    "12 كتاب/سنة",
    "تقدم الصفحات",
    "تأملات القراءة",
  ],
  finance: [
    "دخل ومصروف وادخار",
    "ميزانية شهرية",
    "تتبع الأقساط",
  ],
  career: [
    "خارطة Financial Analyst",
    "مهارات وكورسات",
    "مشاريع Portfolio",
  ],
  timeblock: [
    "جدول أسبوعي",
    "فئات الأنشطة",
    "معدل التنفيذ",
  ],
  pomodoro: [
    "جلسات 25/5 دقيقة",
    "تتبع الدورات",
    "سجل الجلسات",
  ],
  review: [
    "مراجعة أسبوعية",
    "مراجعة شهرية",
    "مراجعة ربع سنوية",
  ],
  archive: [
    "أرشفة السنة",
    "مقارنة بين السنوات",
    "استعادة البيانات",
  ],
};

export function SectionPage() {
  const pathname = usePathname();
  const page = getPageMeta(pathname);
  const features = SECTION_FEATURES[page.id] ?? ["قريباً"];

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <SectionPlaceholder
          icon={page.icon}
          title={page.title}
          description={page.sub}
          features={features}
        />
      </div>
    </>
  );
}
