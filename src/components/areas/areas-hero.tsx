"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ParticlesBackground } from "@/components/motion/particles-background";
import { SectionReveal } from "@/components/motion/unfold-reveal";
import type { AreasOverviewStats } from "@/types/areas";
import { cn } from "@/lib/utils";

interface AreasHeroProps {
  stats: AreasOverviewStats;
  loading?: boolean;
}

const KPI_ITEMS: {
  key: keyof AreasOverviewStats;
  label: string;
  suffix?: string;
  icon: string;
}[] = [
  { key: "lifeScore", label: "Life Score", suffix: "%", icon: "✦" },
  { key: "activeGoals", label: "أهداف نشطة", icon: "🎯" },
  { key: "activeProjects", label: "مشاريع نشطة", icon: "📁" },
  { key: "habits", label: "عادات", icon: "🔄" },
  { key: "tasksThisWeek", label: "مهام هذا الأسبوع", icon: "📋" },
  { key: "areasNeedingAttention", label: "تحتاج انتباه", icon: "⚡" },
];

export function AreasHero({ stats, loading }: AreasHeroProps) {
  return (
    <SectionReveal index={0}>
      <div className="relative overflow-hidden rounded-2xl liquid-glass glass-blur-xl glass-reflect glass-inner-glow areas-hero-shell">
        <div className="areas-hero-gradient absolute inset-0 opacity-80" />
        <ParticlesBackground className="z-[1]" color="var(--gold)" count={24} />

        <div className="relative z-[2] p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="text-[10px] uppercase tracking-[0.2em] text-text3 mb-2"
              >
                Life Areas · PARA Philosophy
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.05 }}
                className="font-display text-2xl md:text-3xl font-black text-text"
              >
                مركز قيادة حياتك
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12 }}
                className="text-sm text-text3 mt-2 max-w-lg"
              >
                كل مجال مرتبط بأهدافه ومشاريعه ومهامه وعاداته — خريطة حية لحياتك.
              </motion.p>
            </div>

            <div className="areas-hero-score liquid-glass glass-blur-md glass-reflect rounded-xl px-6 py-4 text-center min-w-[140px] glass-inner-glow">
              <div className="text-[10px] uppercase tracking-widest text-text3 mb-1">Overall</div>
              {loading ? (
                <div className="h-10 w-20 skeleton-shimmer rounded mx-auto" />
              ) : (
                <div className="text-4xl font-black text-gold2">
                  <AnimatedCounter value={stats.lifeScore} suffix="%" />
                </div>
              )}
              <div className="text-xs text-text3 mt-1">Life Score</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
            {KPI_ITEMS.slice(1).map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 32,
                  delay: 0.08 + i * 0.06,
                }}
                className={cn(
                  "areas-kpi-tile liquid-glass glass-blur-sm glass-reflect rounded-xl p-3 text-center glass-lift",
                  item.key === "areasNeedingAttention" && stats.areasNeedingAttention > 0 && "glass-glow-warning"
                )}
              >
                <div className="text-sm mb-1">{item.icon}</div>
                {loading ? (
                  <div className="h-6 w-10 skeleton-shimmer rounded mx-auto" />
                ) : (
                  <div className="text-xl font-black font-mono text-text">
                    <AnimatedCounter value={stats[item.key]} suffix={item.suffix} />
                  </div>
                )}
                <div className="text-[10px] text-text3 mt-0.5 leading-tight">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
