"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { today } from "@/lib/utils";
import type { DashboardHabitToday } from "@/types/lifeos-pro";
import Link from "next/link";

interface HabitsTodayProps {
  habits: DashboardHabitToday[];
  onToggle: () => void;
}

export function HabitsToday({ habits, onToggle }: HabitsTodayProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const done = habits.filter((h) => h.done).length;
  const pct = habits.length ? Math.round((done / habits.length) * 100) : 0;

  async function toggle(habitId: string) {
    setBusy(habitId);
    try {
      await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: today() }),
      });
      onToggle();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>🔄 عادات اليوم</CardTitle>
        <span className="text-xs font-mono text-gold2">{done}/{habits.length} · {pct}%</span>
      </CardHeader>
      <CardBody className="!py-2 space-y-1 max-h-64 overflow-y-auto">
        {habits.length === 0 ? (
          <p className="text-text3 text-sm py-4 text-center">
            لا عادات يومية —{" "}
            <Link href="/habits" className="text-gold2 hover:underline">
              أضف عادة
            </Link>
          </p>
        ) : (
          habits.map((h) => (
            <label
              key={h.id}
              className={`flex items-center gap-3 p-2.5 rounded-sm cursor-pointer transition-colors ${
                h.done ? "bg-emerald/10 border border-emerald/20" : "bg-surface2/50 border border-transparent hover:border-border"
              } ${busy === h.id ? "opacity-60" : ""}`}
            >
              <input
                type="checkbox"
                checked={h.done}
                disabled={busy === h.id}
                onChange={() => toggle(h.id)}
                className="w-4 h-4 accent-[var(--gold)]"
              />
              <span className={`text-sm flex-1 ${h.done ? "line-through text-text3" : ""}`}>
                {h.name}
              </span>
              {h.timeOfDay && (
                <span className="text-[10px] text-text3">{h.timeOfDay}</span>
              )}
            </label>
          ))
        )}
      </CardBody>
    </Card>
  );
}
