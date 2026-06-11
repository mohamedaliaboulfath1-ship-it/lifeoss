"use client";

import { BentoGrid, BentoTile } from "@/components/ui/bento-grid";
import { PremiumSurface } from "@/components/motion/premium-surface";
import { RemotionEmbed } from "@/components/remotion/remotion-embed";
import { WeeklyReview } from "@/remotion/compositions/weekly-review";
import { MonthlyBriefing } from "@/remotion/compositions/monthly-briefing";
import { YearInReview } from "@/remotion/compositions/year-in-review";

interface RecapData {
  lifeScore: number;
  habitsPct: number;
  workouts: number;
  goalsDone: number;
  learningHours: number;
  topWin?: string;
  topRisk?: string;
  opportunity?: string;
  year: string;
  habitsCompleted: number;
  booksRead: number;
  weightDelta: number;
  savingsTotal: number;
}

export function RemotionRecapSection({ data }: { data: RecapData }) {
  const weekLabel = `الأسبوع ${Math.ceil(new Date().getDate() / 7)}`;
  const monthLabel = new Date().toLocaleDateString("ar-SA", { month: "long", year: "numeric" });

  return (
    <BentoGrid className="mb-6">
      <BentoTile span="wide" delay={0}>
        <PremiumSurface variant="gradient-indigo" className="p-4 overflow-hidden">
          <h3 className="text-sm font-bold text-gold2 mb-3">🎬 Weekly Review — ملخص بصري</h3>
          <RemotionEmbed
            component={WeeklyReview}
            durationInFrames={150}
            width={640}
            height={280}
            inputProps={{
              weekLabel,
              habitsPct: data.habitsPct,
              workouts: data.workouts,
              goalsDone: data.goalsDone,
              learningHours: data.learningHours,
              lifeScore: data.lifeScore,
            }}
            loop
            className="rounded-lg overflow-hidden mx-auto max-w-full"
          />
        </PremiumSurface>
      </BentoTile>

      <BentoTile span="6" delay={0.05}>
        <PremiumSurface variant="gradient-blue" className="p-4 overflow-hidden">
          <h3 className="text-sm font-bold text-gold2 mb-3">📊 Executive Briefing</h3>
          <RemotionEmbed
            component={MonthlyBriefing}
            durationInFrames={180}
            width={480}
            height={260}
            inputProps={{
              monthLabel,
              lifeScore: data.lifeScore,
              topWin: data.topWin ?? "استمرار العادات اليومية",
              topRisk: data.topRisk ?? "لا مخاطر حرجة",
              opportunity: data.opportunity ?? "تعزيز التعلم",
            }}
            loop
            className="rounded-lg overflow-hidden mx-auto"
          />
        </PremiumSurface>
      </BentoTile>

      <BentoTile span="6" delay={0.08}>
        <PremiumSurface variant="gradient-emerald" className="p-4 overflow-hidden">
          <h3 className="text-sm font-bold text-gold2 mb-3">✨ Year In Review</h3>
          <RemotionEmbed
            component={YearInReview}
            durationInFrames={240}
            width={480}
            height={280}
            inputProps={{
              year: data.year,
              habitsCompleted: data.habitsCompleted,
              booksRead: data.booksRead,
              weightDelta: data.weightDelta,
              learningHours: data.learningHours,
              savingsTotal: data.savingsTotal,
              lifeScore: data.lifeScore,
            }}
            loop
            className="rounded-lg overflow-hidden mx-auto"
          />
        </PremiumSurface>
      </BentoTile>
    </BentoGrid>
  );
}
