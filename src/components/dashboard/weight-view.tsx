"use client";

import { useMemo, useState } from "react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { estimateWeeksToTarget } from "@/lib/calculations";
import { fmt, today } from "@/lib/utils";
import { useToast } from "@/contexts/toast-context";
import type { WeightLog, YearPayload } from "@/types/lifeos";

interface WeightViewProps {
  yearData: YearPayload;
  startWeight?: number | null;
  targetWeight?: number | null;
  onRefresh: () => void;
}

export function WeightView({
  yearData,
  startWeight = 62,
  targetWeight = 75,
  onRefresh,
}: WeightViewProps) {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: today(),
    weight: "",
    sleep: "",
    cals: "",
    note: "",
  });

  const logs = useMemo(
    () =>
      [...(yearData.weightLogs ?? [])].sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
    [yearData.weightLogs]
  );

  const latest = logs[logs.length - 1];
  const current = latest?.weight ?? startWeight ?? 62;
  const target = targetWeight ?? 75;
  const start = startWeight ?? logs[0]?.weight ?? current;
  const pct =
    target > start
      ? Math.max(0, Math.min(100, Math.round(((current - start) / (target - start)) * 100)))
      : 0;
  const weeksLeft = estimateWeeksToTarget(current, target);
  const weeklyGain =
    logs.length >= 2
      ? logs[logs.length - 1].weight - logs[logs.length - 2].weight
      : null;

  async function saveLog() {
    const w = parseFloat(form.weight);
    if (!w || w <= 0) return;
    const res = await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        weight: w,
        sleep: form.sleep ? parseFloat(form.sleep) : undefined,
        cals: form.cals ? parseInt(form.cals, 10) : undefined,
        note: form.note || undefined,
      }),
    });
    if (res.ok) {
      toast("تم تسجيل الوزن", "success");
      setModalOpen(false);
      setForm({ date: today(), weight: "", sleep: "", cals: "", note: "" });
      onRefresh();
    } else {
      toast("فشل الحفظ", "error");
    }
  }

  async function removeLog(id: string) {
    if (!confirm("حذف هذا السجل؟")) return;
    await fetch(`/api/weight?id=${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="p-4 rounded-[10px] border border-gold/25 bg-gold/5">
        <div className="text-xs text-gold2 font-bold mb-1">مرحلة البناء — Bulk</div>
        <p className="text-text2 text-sm">
          الهدف: من {start} كجم إلى {target} كجم — تركيز على سعرات عالية سهلة الهضم
          (أرز كريمة، زيت زيتون، مكسرات).
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="الوزن الحالي" value={`${current} كجم`} sub="" color="var(--gold)" />
        <KpiCard label="التقدم" value={`${pct}%`} sub={`نحو ${target} كجم`} color="var(--emerald)" />
        <KpiCard
          label="الأسبوع الماضي"
          value={weeklyGain != null ? `${weeklyGain > 0 ? "+" : ""}${weeklyGain.toFixed(1)} كجم` : "—"}
          sub="معدل الأسبوع"
          color="var(--sky)"
        />
        <KpiCard
          label="الوصول المتوقع"
          value={weeksLeft != null ? `${weeksLeft} أسبوع` : "—"}
          sub="بمعدل 0.35 كجم/أسبوع"
          color="var(--purple)"
        />
      </div>

      <Card className="p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-gold2">مسار الوزن</span>
          <Button variant="gold" size="sm" onClick={() => setModalOpen(true)}>
            + تسجيل
          </Button>
        </div>
        <ProgressBar value={pct} color="var(--gold)" className="mb-4 h-2" />
        {logs.length > 0 ? (
          <WeightChart logs={logs} min={Math.min(start, ...logs.map((l) => l.weight)) - 1} max={target + 2} />
        ) : (
          <EmptyState
            icon="⚖️"
            title="لا توجد قياسات بعد"
            description="سجّل وزنك الأسبوعي لمتابعة مرحلة البناء"
            actionLabel="تسجيل الوزن"
            onAction={() => setModalOpen(true)}
          />
        )}
      </Card>

      {logs.length > 0 && (
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text3 text-xs border-b border-border">
                <th className="text-right py-2">التاريخ</th>
                <th className="text-right py-2">الوزن</th>
                <th className="text-right py-2">نوم</th>
                <th className="text-right py-2">سعرات</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...logs].reverse().map((l) => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="py-2 font-mono text-xs">{fmt(l.date)}</td>
                  <td className="py-2 font-bold text-gold2">{l.weight} كجم</td>
                  <td className="py-2 text-text2">{l.sleep ?? "—"}</td>
                  <td className="py-2 text-text2">{l.cals ?? "—"}</td>
                  <td className="py-2">
                    <Button variant="danger" size="sm" onClick={() => removeLog(l.id)}>
                      🗑
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border2 rounded-[10px] w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gold2">⚖️ تسجيل وزن</h3>
            <div>
              <Label>التاريخ</Label>
              <Input
                type="date"
                dir="ltr"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <Label>الوزن (كجم)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ساعات النوم</Label>
                <Input
                  type="number"
                  value={form.sleep}
                  onChange={(e) => setForm({ ...form, sleep: e.target.value })}
                />
              </div>
              <div>
                <Label>السعرات</Label>
                <Input
                  type="number"
                  value={form.cals}
                  onChange={(e) => setForm({ ...form, cals: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                إلغاء
              </Button>
              <Button variant="gold" onClick={saveLog}>
                حفظ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeightChart({
  logs,
  min,
  max,
}: {
  logs: WeightLog[];
  min: number;
  max: number;
}) {
  const range = max - min || 1;

  return (
    <div className="h-32 flex items-end gap-0.5 relative">
      {logs.map((l) => {
        const h = ((l.weight - min) / range) * 100;
        return (
          <div
            key={l.id}
            className="flex-1 min-w-[8px] rounded-t-sm bg-gradient-to-t from-gold/40 to-gold2 transition-all hover:opacity-90"
            style={{ height: `${Math.max(8, h)}%` }}
            title={`${l.weight} كجم — ${fmt(l.date)}`}
          />
        );
      })}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-text3 font-mono pointer-events-none">
        <span>{min.toFixed(0)}</span>
        <span>{max.toFixed(0)} كجم</span>
      </div>
    </div>
  );
}
