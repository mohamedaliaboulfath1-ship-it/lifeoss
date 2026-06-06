"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { today } from "@/lib/utils";
import type { DashboardHabitToday } from "@/types/lifeos-pro";
import Link from "next/link";
import { useLifeOS } from "@/contexts/lifeos-context";
import { useToast } from "@/contexts/toast-context";

interface HabitsTodayProps {
  habits: DashboardHabitToday[];
}

export function HabitsToday({ habits }: HabitsTodayProps) {
  const { refreshSilent } = useLifeOS();
  const { toast } = useToast();
  const [local, setLocal] = useState(habits);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setLocal(habits);
  }, [habits]);

  const done = local.filter((h) => h.done).length;
  const pct = local.length ? Math.round((done / local.length) * 100) : 0;

  async function toggle(habitId: string) {
    const prev = local.find((h) => h.id === habitId)?.done ?? false;
    setLocal((list) =>
      list.map((h) => (h.id === habitId ? { ...h, done: !prev } : h))
    );
    setBusy(habitId);
    try {
      const res = await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: today() }),
      });
      if (!res.ok) throw new Error("failed");
      void refreshSilent();
    } catch {
      setLocal((list) =>
        list.map((h) => (h.id === habitId ? { ...h, done: prev } : h))
      );
      toast("تعذّر تحديث العادة", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>🔄 عادات اليوم</CardTitle>
        <span className="text-xs font-mono text-gold2">
          {done}/{local.length} · {pct}%
        </span>
      </CardHeader>
      <CardBody className="!py-2 space-y-1 max-h-64 overflow-y-auto">
        {local.length === 0 ? (
          <p className="text-text3 text-sm py-4 text-center">
            لا عادات يومية —{" "}
            <Link href="/habits" className="text-gold2 hover:underline">
              أضف عادة
            </Link>
          </p>
        ) : (
          local.map((h) => (
            <label
              key={h.id}
              className={`flex items-center gap-3 p-2.5 rounded-sm cursor-pointer transition-colors ${
                h.done
                  ? "bg-emerald/10 border border-emerald/20"
                  : "bg-surface2/50 border border-transparent hover:border-border"
              } ${busy === h.id ? "opacity-70" : ""}`}
            >
              <input
                type="checkbox"
                checked={h.done}
                disabled={busy === h.id}
                onChange={() => toggle(h.id)}
                className="w-4 h-4 accent-[var(--gold)]"
              />
              <span
                className={`text-sm flex-1 ${h.done ? "line-through text-text3" : ""}`}
              >
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
