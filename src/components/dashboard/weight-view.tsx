"use client";
import { ViewShell } from "@/components/motion/view-shell";

import { useMemo, useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { BodyPlanPanel, type BodyPlan } from "@/components/body/body-plan-panel";
import {
  resolveCurrentWeight,
  calcWeeklyGainFromLogs,
  calcAverageWeeklyGain,
  weightForecast,
} from "@/lib/body/weight-forecast";
import { fmt, today } from "@/lib/utils";
import { useToast } from "@/contexts/toast-context";
import type { WeightLog, YearPayload } from "@/types/lifeos";

interface WeightViewProps {
  yearData: YearPayload;
  startWeight?: number | null;
  targetWeight?: number | null;
  currentWeight?: number | null;
  bodyPlan?: BodyPlan;
  dailyCalories?: number | null;
  proteinTarget?: number | null;
  carbsTarget?: number | null;
  fatsTarget?: number | null;
  height?: number | null;
  onRefresh: () => void;
}

export function WeightView({
  yearData,
  startWeight,
  targetWeight,
  currentWeight: profileCurrent,
  bodyPlan,
  dailyCalories,
  proteinTarget,
  carbsTarget,
  fatsTarget,
  height,
  onRefresh,
}: WeightViewProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"track" | "plan">("track");
  const [modalOpen, setModalOpen] = useState(false);
  const [quickWeight, setQuickWeight] = useState("");
  const [form, setForm] = useState({
    date: today(),
    weight: "",
    sleep: "",
    cals: "",
    note: "",
  });

  const logs = useMemo(
    () => [...(yearData.weightLogs ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [yearData.weightLogs]
  );

  const latest = logs[logs.length - 1];
  const current = resolveCurrentWeight({
    latestLog: latest?.weight,
    profileCurrent: profileCurrent ?? undefined,
  });
  const target = targetWeight ?? 75;
  const start = startWeight ?? logs[0]?.weight ?? current ?? null;
  const weeklyGainTarget = bodyPlan?.weeklyGainTarget ?? 0.35;
  const observedWeekly =
    calcAverageWeeklyGain(logs.map((l) => l.weight), 4) ??
    calcWeeklyGainFromLogs(logs.map((l) => l.weight));
  const rateForForecast = observedWeekly && observedWeekly > 0 ? observedWeekly : weeklyGainTarget;

  const forecast =
    current != null
      ? weightForecast({ current, target, start: start ?? current, weeklyRate: rateForForecast })
      : null;

  async function saveWeight(w: number, date?: string) {
    const res = await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: date ?? today(),
        weight: w,
      }),
    });
    if (res.ok) {
      toast("تم حفظ الوزن", "success");
      onRefresh();
      return true;
    }
    toast("فشل الحفظ", "error");
    return false;
  }

  async function saveLog() {
    const w = parseFloat(form.weight);
    if (!w || w <= 0) return;
    const ok = await saveWeight(w, form.date);
    if (ok) {
      setModalOpen(false);
      setForm({ date: today(), weight: "", sleep: "", cals: "", note: "" });
    }
  }

  async function quickSave() {
    const w = parseFloat(quickWeight);
    if (!w || w <= 0) return;
    const ok = await saveWeight(w);
    if (ok) setQuickWeight("");
  }

  async function removeLog(id: string) {
    if (!confirm("حذف هذا السجل؟")) return;
    await fetch(`/api/weight?id=${id}`, { method: "DELETE" });
    onRefresh();
  }

  if (tab === "plan") {
    return (
      <ViewShell>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setTab("track")}>← التتبع</Button>
        </div>
        <BodyPlanPanel
          profile={{
            startWeight,
            targetWeight,
            currentWeight: profileCurrent,
            height,
            dailyCalories,
            proteinTarget,
            carbsTarget,
            fatsTarget,
            bodyPlan,
          }}
          onSaved={onRefresh}
        />
      </ViewShell>
    );
  }

  return (
    <ViewShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="p-4 rounded-[10px] border border-gold/25 bg-gold/5 flex-1 min-w-[240px]">
          <div className="text-xs text-gold2 font-bold mb-1">
            {bodyPlan?.dietPlan ?? "خطة زيادة الوزن"}
          </div>
          <p className="text-text2 text-sm">
            {current != null
              ? `الآن ${current} كجم → الهدف ${target} كجم`
              : "لم تسجّل وزنك بعد — أدخله أدناه"}
            {forecast && forecast.remaining > 0 && (
              <> · متبقي <strong>{forecast.remaining} كجم</strong></>
            )}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setTab("plan")}>⚙️ تعديل خطتي</Button>
      </div>

      {/* إدخال يدوي سريع */}
      <Card className="p-5 border-gold/40">
        <div className="text-sm font-bold text-gold2 mb-3">⚖️ سجّل وزنك الآن</div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <Label>الوزن الحالي (كجم)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder={current != null ? String(current) : "62"}
              value={quickWeight}
              onChange={(e) => setQuickWeight(e.target.value)}
            />
          </div>
          <Button variant="gold" onClick={quickSave}>حفظ الوزن</Button>
          <Button variant="ghost" onClick={() => setModalOpen(true)}>تسجيل مفصّل</Button>
        </div>
        {current == null && (
          <p className="text-xs text-amber2 mt-2">
            الرقم 70 الذي رأيته كان قيمة افتراضية في الكود — لن يظهر بعد أن تسجّل وزنك الحقيقي (62).
          </p>
        )}
      </Card>

      {current != null && forecast && (
        <ViewShell.Cards>
          <KpiCard label="الوزن الحالي" value={`${current} كجم`} sub="" color="var(--gold)" />
          <KpiCard
            label="متبقي للهدف"
            value={`${forecast.remaining} كجم`}
            sub={`حتى ${target} كجم`}
            color="var(--emerald)"
          />
          <KpiCard
            label="معدلك الأسبوعي"
            value={observedWeekly != null ? `${observedWeekly > 0 ? "+" : ""}${observedWeekly} كجم` : `${weeklyGainTarget} كجم`}
            sub={observedWeekly != null ? "من سجلاتك" : "مستهدف"}
            color="var(--sky)"
          />
          <KpiCard
            label="الوصول المتوقع"
            value={forecast.weeks != null ? `${forecast.weeks} أسبوع` : "—"}
            sub={forecast.forecastDate ?? `بمعدل ${rateForForecast} كجم/أسبوع`}
            color="var(--purple)"
          />
        </ViewShell.Cards>
      )}

      {current != null && forecast && (
        <Card className="p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-gold2">مسار الوزن — {forecast.progressPct}%</span>
            <Button variant="gold" size="sm" onClick={() => setModalOpen(true)}>+ تسجيل</Button>
          </div>
          <ProgressBar value={forecast.progressPct} color="var(--gold)" className="mb-4 h-2" />
          {forecast.weeks != null && (
            <p className="text-sm text-text2">
              إذا حافظت على معدل <strong>{rateForForecast} كجم/أسبوع</strong>، تصل إلى{" "}
              <strong>{target} كجم</strong> بحلول <strong>{forecast.forecastDate}</strong>
              {" "}(بعد {forecast.weeks} أسبوع).
            </p>
          )}
          {logs.length > 0 && (
            <WeightChart
              logs={logs}
              min={Math.min(start ?? current, ...logs.map((l) => l.weight)) - 1}
              max={target + 2}
            />
          )}
        </Card>
      )}

      {current == null && (
        <EmptyState
          icon="⚖️"
          title="ابدأ بتسجيل وزنك"
          description="أدخل 62 كجم في الحقل أعلاه ثم اضغط «حفظ الوزن»"
          actionLabel="فتح إعداد الخطة"
          onAction={() => setTab("plan")}
        />
      )}

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
                    <Button variant="danger" size="sm" onClick={() => removeLog(l.id)}>🗑</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <AppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تسجيل وزن"
        icon="⚖️"
        size="md"
        onSave={saveLog}
      >
        <div>
          <Label>التاريخ</Label>
          <Input type="date" dir="ltr" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <Label>الوزن (كجم)</Label>
          <Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>ساعات النوم</Label>
            <Input type="number" value={form.sleep} onChange={(e) => setForm({ ...form, sleep: e.target.value })} />
          </div>
          <div>
            <Label>السعرات</Label>
            <Input type="number" value={form.cals} onChange={(e) => setForm({ ...form, cals: e.target.value })} />
          </div>
        </div>
      </AppModal>
    </ViewShell>
  );
}

function WeightChart({ logs, min, max }: { logs: WeightLog[]; min: number; max: number }) {
  const range = max - min || 1;
  return (
    <div className="h-32 flex items-end gap-0.5 relative mt-4">
      {logs.map((l) => {
        const h = ((l.weight - min) / range) * 100;
        return (
          <div
            key={l.id}
            className="flex-1 min-w-[8px] rounded-t-sm bg-gradient-to-t from-gold/40 to-gold2"
            style={{ height: `${Math.max(8, h)}%` }}
            title={`${l.weight} كجم — ${fmt(l.date)}`}
          />
        );
      })}
    </div>
  );
}
