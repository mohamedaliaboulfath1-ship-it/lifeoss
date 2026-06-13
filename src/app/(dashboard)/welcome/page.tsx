"use client";

import Link from "next/link";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { WelcomeChecklistPanel } from "@/components/onboarding/welcome-checklist";
import { useLifeOSData } from "@/contexts/lifeos-context";
import { startTour, TOUR_IDS } from "@/lib/tours/driver-tours";
import { Play, BookOpen, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function WelcomePage() {
  const { data } = useLifeOSData();
  const name = data?.profile.displayName ?? "مستخدم";

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8" data-tour="main-content">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <header className="text-center space-y-3">
          <div className="text-5xl">🏛️</div>
          <h1 className="font-display text-2xl md:text-3xl font-black text-gold2">
            مرحباً، {name}
          </h1>
          <p className="text-text2 text-sm max-w-lg mx-auto">
            LifeOS جاهز — كل الوحدات مفعّلة ببيانات تجريبية. استبدلها تدريجياً ببياناتك الحقيقية.
          </p>
        </header>

        <GlassCard className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Play className="w-5 h-5 text-gold2" />
            <h2 className="font-bold text-lg">فيديو ترحيبي</h2>
          </div>
          <div className="aspect-video rounded-xl border border-dashed border-gold/30 bg-gradient-to-br from-surface2/80 to-surface/40 flex items-center justify-center">
            <div className="text-center text-text3">
              <Play className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">منطقة الفيديو — جاهزة للمحتوى المستقبلي</p>
            </div>
          </div>
        </GlassCard>

        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-mint" />
              <h2 className="font-bold">قائمة البداية</h2>
            </div>
            <WelcomeChecklistPanel checklist={data?.profile.saas?.welcomeChecklist} />
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-sky2" />
              <h2 className="font-bold">جولات تفاعلية</h2>
            </div>
            <p className="text-sm text-text2">
              تعرّف على النظام خطوة بخطوة — يمكنك إعادة الجولة في أي وقت.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTour(TOUR_IDS.dashboard)}
              >
                لوحة التحكم
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTour(TOUR_IDS.goals)}
              >
                الأهداف
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTour(TOUR_IDS.habits)}
              >
                العادات
              </Button>
            </div>
            <Link href="/guide">
              <Button variant="ghost" size="sm" className="w-full mt-2">
                دليل المستخدم الكامل ←
              </Button>
            </Link>
          </GlassCard>
        </div>

        <GlassCard className="p-6 text-center">
          <p className="text-text2 text-sm mb-4">
            البيانات التجريبية مُعلَّمة كـ Demo — لن تختلط ببيانات أي مستخدم آخر.
          </p>
          <Link href="/dashboard">
            <Button variant="gold">انتقل إلى لوحة التحكم</Button>
          </Link>
        </GlassCard>
      </motion.div>
    </div>
  );
}
