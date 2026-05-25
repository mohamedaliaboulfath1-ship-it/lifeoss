"use client";

import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  areaColor,
  buildAlerts,
  calcCareerPct,
  calcGoalPct,
  calcOverallHabitPct,
} from "@/lib/calculations";
import { commas, isThisWeek } from "@/lib/utils";
import type { YearPayload } from "@/types/lifeos";
import Link from "next/link";

interface Profile {
  displayName: string;
  startWeight?: number | null;
  targetWeight?: number | null;
}

interface DashboardViewProps {
  profile: Profile;
  yearData: YearPayload;
}

export function DashboardView({ profile, yearData }: DashboardViewProps) {
  const wLogs = yearData.weightLogs ?? [];
  const curWeight = wLogs.length
    ? wLogs[wLogs.length - 1].weight
    : (profile.startWeight ?? 0);
  const start = profile.startWeight ?? curWeight;
  const target = profile.targetWeight ?? start;
  const weightPct =
    target !== start
      ? Math.round(((curWeight - start) / (target - start)) * 100)
      : 0;

  const workoutLogs = (yearData.workoutLogs ?? []) as { date?: string }[];
  const thisWeekW = workoutLogs.filter((w) => isThisWeek(w.date)).length;
  const totalSavings = (yearData.transactions ?? [])
    .filter((t) => t.type === "saving")
    .reduce((a, b) => a + b.amount, 0);
  const booksRead = (yearData.books ?? []).filter((b) => b.status === "done").length;
  const habitPct = calcOverallHabitPct(yearData);
  const alerts = buildAlerts(yearData, profile);

  const pillars = [
    ["💪", "الجسد", weightPct, "var(--gold)", "🟡 ابدأ"],
    ["💰", "المال", Math.min(100, Math.round(totalSavings / 120)), "var(--emerald)", "✅ منضبط"],
    ["📈", "المهنة", calcCareerPct(yearData), "var(--sky)", "🟡 في البناء"],
    ["🧠", "العقل", Math.min(100, booksRead * 8), "var(--purple)", "📚 قراءة"],
    ["⚡", "الانضباط", habitPct, "var(--amber2)", "🎯 يومي"],
    ["🕌", "الروح", habitPct, "var(--gold2)", "🕌 يومي"],
  ] as const;

  const days7 = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[26px] font-black mb-1">
          مرحباً،{" "}
          <span className="bg-gradient-to-br from-gold to-gold3 bg-clip-text text-transparent">
            {profile.displayName} ✦
          </span>
        </h2>
        <p className="text-text3 text-[13px]">
          الاستمرارية تبني الشخصية — اليوم فرصة جديدة.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="⚖️ الوزن"
          value={`${curWeight} كجم`}
          sub={`الهدف: ${target} كجم`}
          color="var(--gold)"
          badge={`${weightPct}%`}
        />
        <KpiCard
          label="💰 الادخار"
          value={`${commas(totalSavings)} ﷼`}
          sub="هدف: 12,000 ﷼"
          color="var(--emerald)"
        />
        <KpiCard
          label="🏋️ تمارين الأسبوع"
          value={`${thisWeekW} / 5`}
          sub="هدف: 5 جلسات/أسبوع"
          color="var(--sky)"
        />
        <KpiCard
          label="📚 كتب مكتملة"
          value={`${booksRead} / ${yearData.books?.length ?? 0}`}
          sub="هدف: 12 كتاب/سنة"
          color="var(--purple)"
        />
      </div>

      <h3 className="text-xs font-bold text-text3 uppercase tracking-widest">
        الأركان السبعة
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pillars.map(([ic, nm, pct, col, st]) => (
          <Card key={nm} className="p-4">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-xl">{ic}</span>
              <span className="text-sm font-bold">{nm}</span>
              <span className="mr-auto text-[10px] text-text3 bg-white/5 px-2 py-0.5 rounded">
                {st}
              </span>
            </div>
            <ProgressBar value={pct} color={col} />
            <div className="text-[11px] text-text3 font-mono mt-2">{pct}%</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>🚨 تنبيهات ذكية</CardTitle>
          </CardHeader>
          <CardBody className="!py-3 space-y-2">
            {alerts.length ? (
              alerts.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-sm border text-sm"
                  style={{ background: a.bg, borderColor: a.border }}
                >
                  <span>{a.icon}</span>
                  <span className="flex-1">{a.msg}</span>
                  <span className="text-[11px] text-gold2">{a.action}</span>
                </div>
              ))
            ) : (
              <p className="text-text3 text-sm text-center py-5">
                ✅ لا تنبيهات حالياً
              </p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>⚡ طاقة اليوم</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3.5">
            {[
              ["💪 الجسد", thisWeekW * 20, "var(--emerald)"],
              ["🧠 العقل", habitPct, "var(--sky)"],
              ["⚡ الإنتاجية", Math.min(100, habitPct + 10), "var(--gold)"],
              ["🕌 الروح", habitPct, "var(--purple2)"],
            ].map(([label, val, col]) => (
              <div key={label as string}>
                <div className="flex justify-between text-xs text-text3 mb-1.5">
                  <span>{label}</span>
                  <span>{val}%</span>
                </div>
                <ProgressBar value={val as number} color={col as string} />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <h3 className="text-xs font-bold text-text3 uppercase tracking-widest">
        الأسبوع الحالي
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ["🏋️ التمارين (أيام)", [1, 0, 1, 0, 1, 1, 0], "var(--emerald)"],
          ["📖 قراءة (دقيقة)", [30, 20, 45, 0, 30, 25, 60], "var(--sky)"],
          ["⚡ العادات (%)", [80, 60, 75, 50, 70, 80, 90], "var(--gold)"],
        ].map(([title, vals, col]) => {
          const values = vals as number[];
          const max = Math.max(...values, 1);
          return (
            <Card key={title as string} className="p-4">
              <div className="text-xs font-bold mb-3">{title}</div>
              <div className="flex items-end justify-between gap-1 h-24">
                {days7.map((l, i) => (
                  <div key={l} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[8px] text-text3 font-mono">
                      {values[i]}
                    </span>
                    <div
                      className="w-full rounded-t-sm opacity-85"
                      style={{
                        height: `${Math.round((values[i] / max) * 70) + 10}px`,
                        background: col as string,
                      }}
                    />
                    <span className="text-[9px] text-text3">{l.slice(0, 2)}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🎯 تقدم الأهداف</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2.5">
          {(yearData.goals ?? []).slice(0, 5).map((g) => {
            const pct = calcGoalPct(g);
            return (
              <div key={g.id} className="flex items-center gap-3">
                <div className="text-[13px] w-44 shrink-0 truncate">{g.title}</div>
                <div className="flex-1">
                  <ProgressBar value={pct} color={areaColor(g.area)} />
                </div>
                <div className="text-[11px] text-text3 font-mono w-9 text-left">
                  {pct}%
                </div>
              </div>
            );
          })}
          {!yearData.goals?.length && (
            <p className="text-text3 text-sm">
              لا أهداف —{" "}
              <Link href="/goals" className="text-gold hover:underline">
                أضف هدفاً الآن
              </Link>
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
