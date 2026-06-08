"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TimeHeatmap } from "@/components/time/time-heatmap";
import { FocusTimer } from "@/components/time/focus-timer";
import type { TimeOverviewPayload } from "@/types/time";

export function TimeIntelligenceView() {
  const [data, setData] = useState<TimeOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (reschedule = false) => {
    setLoading(true);
    const res = await fetch(`/api/time/overview${reschedule ? "?reschedule=1" : ""}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading && !data) return <div className="h-64 skeleton-shimmer rounded-[10px]" />;
  if (!data) return <p className="text-text3">تعذر تحميل بيانات الوقت</p>;

  const riskColor = (r: string) => (r === "high" ? "text-red2" : r === "medium" ? "text-amber2" : "text-emerald");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Intelligence"
        subtitle="أين يذهب وقتك؟ — Actual vs Planned · Focus · Capacity"
      />

      <div className="flex flex-wrap gap-2">
        <Link href="/planner"><Button variant="gold">📅 Planner</Button></Link>
        <Button variant="ghost" onClick={() => void load(true)}>إعادة جدولة تلقائية</Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-text3">Time Budget اليوم</div>
          <div className="text-2xl font-black text-gold2">{data.todayCapacity.availableHours}س</div>
          <div className="text-[10px] text-text3">متبقي {data.todayCapacity.remainingHours.toFixed(1)}س</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text3">Focus Score</div>
          <div className="text-2xl font-black">{data.focusScore.score}%</div>
          <ProgressBar value={data.focusScore.score} color="var(--gold)" className="h-1 mt-2" />
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text3">Utilization</div>
          <div className="text-2xl font-black">{data.utilizationPct}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text3">Deep Work (أسبوع)</div>
          <div className="text-2xl font-black">{data.deepWorkHours.week}س</div>
          <div className="text-[10px] text-text3">شهر: {data.deepWorkHours.month}س · سنة: {data.deepWorkHours.year}س</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm font-bold mb-3">📊 Actual vs Planned — هذا الأسبوع</div>
          {data.allocations.length ? data.allocations.map((a) => (
            <div key={a.domainId} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{a.nameAr}</span>
                <span className="font-mono text-xs">
                  {(a.actualMinutes / 60).toFixed(1)}س / {(a.plannedMinutes / 60).toFixed(1)}س
                </span>
              </div>
              <ProgressBar
                value={a.plannedMinutes > 0 ? Math.min(100, Math.round((a.actualMinutes / a.plannedMinutes) * 100)) : 0}
                color={a.color}
                className="h-1.5"
              />
            </div>
          )) : <p className="text-text3 text-sm">لا تخصيص بعد — <Link href="/planner" className="text-gold2">جدول في Planner</Link></p>}
        </Card>

        <Card className="p-4">
          <div className="text-sm font-bold mb-3">🔥 Time Heatmap</div>
          <TimeHeatmap cells={data.heatmap} />
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm font-bold mb-2">⚠️ المخاطر</div>
          <div className="text-sm">Burnout: <span className={riskColor(data.burnoutRisk)}>{data.burnoutRisk}</span></div>
          <div className="text-sm">Overcommit: <span className={riskColor(data.overcommitmentRisk)}>{data.overcommitmentRisk}</span></div>
          <div className="text-[10px] text-text3 mt-2">
            متاح: {data.weeklyCapacity.totalAvailableHours}س · مخطط: {data.weeklyCapacity.totalPlannedHours}س
          </div>
        </Card>

        <Card className="p-4 md:col-span-2">
          <div className="text-sm font-bold mb-2">🎯 Goal Time Forecasts</div>
          {!data.goalForecasts.length && <p className="text-text3 text-sm">أضف required_hours للأهداف في /goals</p>}
          {data.goalForecasts.map((g) => (
            <div key={g.goalId} className="text-sm p-2 rounded-sm bg-surface2/50 mb-1 flex justify-between">
              <span>{g.title}</span>
              <span className="text-text3 text-xs">
                {g.loggedHours}/{g.requiredHours}س · {g.riskLevel === "high" ? "⚠️" : "✓"}
                {g.expectedWeeks && ` · ~${g.expectedWeeks} أسبوع`}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {data.missedBlocks.length > 0 && (
        <Card className="p-4 border-amber2/30">
          <div className="text-sm font-bold mb-2">⏰ كتل فائتة ({data.missedBlocks.length})</div>
          {data.missedBlocks.slice(0, 5).map((b) => (
            <div key={b.id} className="text-sm text-text3">{b.title} — {new Date(b.startAt).toLocaleString("ar-SA")}</div>
          ))}
          <Button variant="ghost" className="mt-2" onClick={() => void load(true)}>إعادة جدولة</Button>
        </Card>
      )}

      <FocusTimer onComplete={() => void load()} />
    </div>
  );
}
