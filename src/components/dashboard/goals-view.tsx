"use client";

import { useState } from "react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { areaColor, areaLabel, calcGoalPct } from "@/lib/calculations";
import type { Goal, GoalArea, GoalTask, YearPayload } from "@/types/lifeos";

const AREAS: GoalArea[] = [
  "body",
  "finance",
  "career",
  "mind",
  "spirit",
  "relation",
  "self",
];

interface GoalsViewProps {
  yearData: YearPayload;
  onRefresh: () => void;
  openAdd?: boolean;
  onAddClose?: () => void;
}

export function GoalsView({
  yearData,
  onRefresh,
  openAdd,
  onAddClose,
}: GoalsViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const showModal = modalOpen || !!openAdd;
  const [form, setForm] = useState({
    title: "",
    area: "body" as GoalArea,
    priority: "high" as const,
    current: "",
    target: "",
    unit: "",
  });

  const goals = yearData.goals ?? [];
  const stats = {
    all: goals.length,
    done: goals.filter((g) => g.done).length,
    high: goals.filter((g) => g.priority === "high").length,
    avg: goals.length
      ? Math.round(goals.reduce((a, g) => a + calcGoalPct(g), 0) / goals.length)
      : 0,
  };

  async function saveGoal() {
    const tasks: GoalTask[] = [];
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tasks }),
    });
    if (res.ok) {
      setModalOpen(false);
      onAddClose?.();
      setForm({ title: "", area: "body", priority: "high", current: "", target: "", unit: "" });
      onRefresh();
    }
  }

  async function deleteGoal(id: string) {
    if (!confirm("حذف هذا الهدف؟")) return;
    await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="📋 إجمالي الأهداف" value={String(stats.all)} sub="" color="var(--gold)" />
        <KpiCard label="✅ مكتملة" value={String(stats.done)} sub="" color="var(--emerald)" />
        <KpiCard label="🔴 عالية الأولوية" value={String(stats.high)} sub="" color="var(--rose)" />
        <KpiCard label="📈 متوسط التقدم" value={`${stats.avg}%`} sub="" color="var(--sky)" />
      </div>

      {AREAS.map((area) => {
        const aGoals = goals.filter((g) => g.area === area);
        return (
          <div key={area}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[13px] font-bold" style={{ color: areaColor(area) }}>
                {areaLabel(area)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setForm((f) => ({ ...f, area }));
                  setModalOpen(true);
                }}
              >
                +
              </Button>
            </div>
            {aGoals.map((g) => (
              <GoalCard key={g.id} goal={g} onDelete={() => deleteGoal(g.id)} />
            ))}
            {!aGoals.length && (
              <p className="text-text3 text-xs py-2">لا أهداف في هذا القسم</p>
            )}
          </div>
        );
      })}

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border2 rounded-[10px] w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gold2">🎯 هدف جديد</h3>
            <div>
              <Label>عنوان الهدف</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>المنطقة</Label>
                <select
                  className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
                  value={form.area}
                  onChange={(e) =>
                    setForm({ ...form, area: e.target.value as GoalArea })
                  }
                >
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {areaLabel(a)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>القيمة الحالية</Label>
                <Input
                  type="number"
                  value={form.current}
                  onChange={(e) => setForm({ ...form, current: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>القيمة المستهدفة</Label>
              <Input
                type="number"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setModalOpen(false);
                  onAddClose?.();
                }}
              >
                إلغاء
              </Button>
              <Button variant="gold" onClick={saveGoal}>
                حفظ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, onDelete }: { goal: Goal; onDelete: () => void }) {
  const pct = calcGoalPct(goal);
  const prColors = { high: "var(--rose)", med: "var(--amber2)", low: "var(--emerald)" };

  return (
    <Card className="mb-2 p-4">
      <div className="flex gap-3">
        <div
          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ background: prColors[goal.priority] ?? "var(--text3)" }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-1">{goal.title}</div>
          <ProgressBar value={pct} color={areaColor(goal.area)} className="mb-1" />
          <div className="text-[10px] text-text3 font-mono">{pct}%</div>
        </div>
        <Button variant="danger" size="sm" onClick={onDelete}>
          🗑
        </Button>
      </div>
    </Card>
  );
}
