"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { calcOverallHabitPct, calcStreak } from "@/lib/calculations";
import { getWeekDates, today } from "@/lib/utils";
import type { YearPayload } from "@/types/lifeos";

interface HabitsViewProps {
  yearData: YearPayload;
  onRefresh: () => void;
  forceAddModal?: boolean;
  onAddModalClose?: () => void;
}

export function HabitsView({
  yearData,
  onRefresh,
  forceAddModal,
  onAddModalClose,
}: HabitsViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const showModal = modalOpen || !!forceAddModal;
  const [name, setName] = useState("");

  const habits = yearData.habits ?? [];
  const logs = yearData.habitLogs ?? {};
  const week = getWeekDates(weekOffset);
  const pct = calcOverallHabitPct(yearData, weekOffset);

  const dayLabels = week.map((d) =>
    new Date(d).toLocaleDateString("ar-SA", { weekday: "short", day: "numeric" })
  );

  async function toggle(habitId: string, date: string) {
    await fetch("/api/habits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, date }),
    });
    onRefresh();
  }

  async function addHabit() {
    if (!name.trim()) return;
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, cat: "prod", freq: "daily" }),
    });
    setName("");
    setModalOpen(false);
    onAddModalClose?.();
    onRefresh();
  }

  async function removeHabit(id: string) {
    if (!confirm("حذف العادة؟")) return;
    await fetch(`/api/habits?id=${id}`, { method: "DELETE" });
    onRefresh();
  }

  const todayDone = habits.filter((h) => logs[h.id]?.[today()]).length;
  const maxStreak = habits.length
    ? Math.max(...habits.map((h) => calcStreak(h.id, logs)), 0)
    : 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <Card className="p-4">
          <div className="text-2xl font-black text-gold2">{pct}%</div>
          <div className="text-[11px] text-text3">إنجاز الأسبوع</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-black text-emerald2">
            {todayDone}/{habits.length}
          </div>
          <div className="text-[11px] text-text3">اليوم</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-black text-sky2">{habits.length}</div>
          <div className="text-[11px] text-text3">عادات نشطة</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-black text-purple2">{maxStreak}</div>
          <div className="text-[11px] text-text3">أطول سلسلة (يوم)</div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setWeekOffset((w) => w - 1)}>
          ← الأسبوع السابق
        </Button>
        <span className="text-text3 text-xs font-mono">أسبوع {week[0]} — {week[6]}</span>
        <Button variant="ghost" onClick={() => setWeekOffset((w) => w + 1)}>
          الأسبوع التالي →
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border text-text3 text-xs">
              <th className="text-right p-3 font-normal">العادة</th>
              {dayLabels.map((l) => (
                <th key={l} className="p-2 font-normal text-center">
                  {l}
                </th>
              ))}
              <th className="p-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => (
              <tr key={h.id} className="border-b border-border/50">
                <td className="p-3 font-medium">{h.name}</td>
                {week.map((d) => {
                  const done = logs[h.id]?.[d];
                  return (
                    <td key={d} className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(h.id, d)}
                        className={`w-7 h-7 rounded-md border-2 mx-auto flex items-center justify-center transition-colors cursor-pointer ${
                          done
                            ? "bg-sky border-sky text-white"
                            : "border-border2 hover:border-gold/50"
                        }`}
                      >
                        {done ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
                <td className="p-2">
                  <button
                    type="button"
                    className="text-rose2 text-xs cursor-pointer"
                    onClick={() => removeHabit(h.id)}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!habits.length && (
          <p className="text-center text-text3 py-8 text-sm">لا عادات — أضف عادتك الأولى</p>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border2 rounded-[10px] w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold">⚡ عادة جديدة</h3>
            <div>
              <Label>اسم العادة</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setModalOpen(false);
                  onAddModalClose?.();
                }}
              >
                إلغاء
              </Button>
              <Button variant="gold" onClick={addHabit}>
                حفظ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
