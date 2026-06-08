"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { DashboardSnapshot } from "@/types/lifeos-pro";
import type { GoalCompletion } from "@/types/para";
import type { YearPayload } from "@/types/lifeos";

interface Props {
  dashboard: DashboardSnapshot;
  yearData: YearPayload;
}

export function ProjectCommandCenter({ dashboard, yearData }: Props) {
  const [completions, setCompletions] = useState<GoalCompletion[]>([]);

  useEffect(() => {
    fetch("/api/goals/completion")
      .then((r) => r.json())
      .then((j) => setCompletions(j.completions ?? []))
      .catch(() => null);
  }, []);

  const projects = (yearData.goals ?? []).filter((g) => g.level === "project" && g.status !== "done").slice(0, 4);
  const atRisk = completions.filter((c) => c.atRisk).slice(0, 3);
  const criticalTasks = dashboard.tasksDueToday?.filter((t) => t.priority === "p1").slice(0, 3) ?? [];

  return (
    <div className="grid xl:grid-cols-2 gap-4">
      <Card className="p-4">
        <div className="text-sm font-bold mb-3">📁 مشاريع اليوم</div>
        <ul className="space-y-2 text-sm">
          {projects.map((p) => (
            <li key={p.id} className="flex justify-between border-b border-border/40 pb-2">
              <Link href="/goals" className="hover:text-gold2">{p.title}</Link>
              <span className="text-gold2 font-mono">{p.progress ?? 0}%</span>
            </li>
          ))}
          {!projects.length && <li className="text-text3">لا مشاريع نشطة — أنشئ مشروعاً من الأهداف</li>}
        </ul>
      </Card>

      <Card className="p-4 border-coral/30">
        <div className="text-sm font-bold mb-3">🚨 أهداف معرضة للخطر</div>
        <ul className="space-y-2 text-sm">
          {atRisk.map((g) => (
            <li key={g.goalId} className="p-2 rounded-sm bg-coral/5 border border-coral/20">
              <div className="font-medium">{g.title}</div>
              <div className="text-xs text-text3">{g.probabilityText}</div>
            </li>
          ))}
          {!atRisk.length && <li className="text-text3">كل الأهداف على المسار</li>}
        </ul>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-bold mb-3">🔄 عادات مؤثرة اليوم</div>
        <ul className="space-y-2 text-sm">
          {(dashboard.todayHabits ?? []).filter((h) => !h.done).slice(0, 4).map((h) => (
            <li key={h.id} className="flex justify-between">
              <span>{h.name}</span>
              <Link href="/habits" className="text-gold2 text-xs">إنجاز →</Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-bold mb-3">⚡ مهام حرجة</div>
        <ul className="space-y-2 text-sm">
          {criticalTasks.map((t) => (
            <li key={t.id}>
              <Link href="/tasks" className="hover:text-gold2">{t.title}</Link>
            </li>
          ))}
          {!criticalTasks.length && <li className="text-text3">لا مهام P1 اليوم</li>}
        </ul>
      </Card>
    </div>
  );
}
