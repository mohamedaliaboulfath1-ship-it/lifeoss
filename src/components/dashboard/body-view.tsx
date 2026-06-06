"use client";

import { useMemo, useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { uid, today } from "@/lib/utils";
import type { Measurement, YearPayload } from "@/types/lifeos";
import { MiniChart } from "@/components/ui/mini-chart";

interface BodyViewProps {
  yearData: YearPayload;
  startWeight?: number | null;
  targetWeight?: number | null;
  onRefresh: () => void;
}

export function BodyView({
  yearData,
  startWeight,
  targetWeight,
  onRefresh,
}: BodyViewProps) {
  const [tab, setTab] = useState("weight");
  const measurements = yearData.measureLogs ?? [];
  const weightLogs = [...(yearData.weightLogs ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const [form, setForm] = useState({ chest: "", waist: "", arm: "" });

  const currentWeight = weightLogs[weightLogs.length - 1]?.weight ?? startWeight ?? 60.9;
  const heightM = 1.74;
  const bmi = currentWeight / (heightM * heightM);
  const bmiLabel = bmi < 18.5 ? "نقص وزن" : bmi < 25 ? "طبيعي" : "فوق الطبيعي";
  const avgWeeklyTrend =
    weightLogs.length > 1
      ? (weightLogs[weightLogs.length - 1].weight - weightLogs[0].weight) / Math.max(1, weightLogs.length - 1)
      : 0;
  const target = targetWeight ?? 75;
  const projectionWeeks = Math.max(
    0,
    Math.round(((target - currentWeight) / Math.max(0.05, avgWeeklyTrend || 0.28)) * 1)
  );

  const weightChartData = useMemo(
    () =>
      weightLogs.map((l) => ({
        label: l.date.slice(5),
        value: l.weight,
      })),
    [weightLogs]
  );

  const latestMeasurement = measurements[measurements.length - 1];
  const leanMass = useMemo(() => {
    if (!latestMeasurement?.waist) return null;
    const bodyFatEstimate = Math.min(30, Math.max(8, 0.6 * latestMeasurement.waist - 8));
    return Number((currentWeight * (1 - bodyFatEstimate / 100)).toFixed(1));
  }, [currentWeight, latestMeasurement?.waist]);

  async function addMeasurement() {
    const m: Measurement = {
      id: uid(),
      date: today(),
      chest: form.chest ? parseFloat(form.chest) : undefined,
      waist: form.waist ? parseFloat(form.waist) : undefined,
      arm: form.arm ? parseFloat(form.arm) : undefined,
    };
    await fetch("/api/body", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(m),
    });
    setForm({ chest: "", waist: "", arm: "" });
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { id: "weight", label: "⚖️ الوزن" },
          { id: "measurements", label: "📏 القياسات" },
          { id: "photos", label: "🖼️ الصور" },
          { id: "analytics", label: "📊 التحليل" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "weight" && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-sm border border-border2 bg-surface2">
                <div className="text-text3">الوزن الحالي</div>
                <div className="text-xl font-black text-gold2">{currentWeight.toFixed(1)} كجم</div>
              </div>
              <div className="p-3 rounded-sm border border-border2 bg-surface2">
                <div className="text-text3">BMI</div>
                <div className="text-xl font-black text-sky2">{bmi.toFixed(1)}</div>
                <div className="text-xs text-text3">{bmiLabel}</div>
              </div>
              <div className="p-3 rounded-sm border border-border2 bg-surface2">
                <div className="text-text3">التوجّه</div>
                <div className="text-xl font-black text-emerald2">
                  {avgWeeklyTrend >= 0 ? "+" : ""}
                  {avgWeeklyTrend.toFixed(2)} كجم/قياس
                </div>
              </div>
              <div className="p-3 rounded-sm border border-border2 bg-surface2">
                <div className="text-text3">توقع الوصول</div>
                <div className="text-xl font-black text-purple2">{projectionWeeks} أسبوع</div>
                <div className="text-xs text-text3">60.9 → 75 كجم</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-bold mb-3">Weight Trend</div>
            <MiniChart data={weightChartData} type="line" color="var(--gold)" />
          </Card>
        </div>
      )}

      {tab === "measurements" && (
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>الصدر (سم)</Label>
              <Input value={form.chest} onChange={(e) => setForm({ ...form, chest: e.target.value })} />
            </div>
            <div>
              <Label>الخصر</Label>
              <Input value={form.waist} onChange={(e) => setForm({ ...form, waist: e.target.value })} />
            </div>
            <div>
              <Label>الذراع</Label>
              <Input value={form.arm} onChange={(e) => setForm({ ...form, arm: e.target.value })} />
            </div>
          </div>
          <Button variant="gold" size="sm" onClick={addMeasurement}>
            + حفظ قياس
          </Button>
          <ul className="text-sm space-y-2">
            {[...measurements].reverse().map((m) => (
              <li key={m.id} className="border-b border-border/50 py-2 font-mono text-xs">
                {m.date} — صدر:{m.chest ?? "—"} خصر:{m.waist ?? "—"} ذراع:{m.arm ?? "—"}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "photos" && (
        <Card className="p-4">
          <div className="text-sm font-bold mb-3">Progress Photos</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {["أمام", "جانب", "خلف"].map((slot) => (
              <div
                key={slot}
                className="aspect-[3/4] rounded-sm border border-dashed border-border2 bg-surface2/50 flex flex-col items-center justify-center text-center text-xs text-text3 p-2"
              >
                <div className="text-lg mb-1">📷</div>
                <div>{slot}</div>
                <div>Placeholder</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-text3 mt-3">
            واجهة مؤقتة لمرحلة MVP، ويمكن ربطها لاحقاً برفع الملفات إلى التخزين.
          </p>
        </Card>
      )}

      {tab === "analytics" && (
        <div className="grid xl:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">تحليل الجسم</div>
            <ul className="space-y-2 text-sm">
              <li className="p-2 rounded-sm border border-border2 bg-surface2">
                الوزن الحالي: <strong>{currentWeight.toFixed(1)} كجم</strong>
              </li>
              <li className="p-2 rounded-sm border border-border2 bg-surface2">
                BMI: <strong>{bmi.toFixed(1)}</strong> ({bmiLabel})
              </li>
              <li className="p-2 rounded-sm border border-border2 bg-surface2">
                الميل العام: <strong>{avgWeeklyTrend >= 0 ? "صاعد" : "هابط"}</strong>
              </li>
              <li className="p-2 rounded-sm border border-gold/30 bg-gold/10 text-gold2">
                الكتلة الخالية من الدهون: <strong>{leanMass != null ? `${leanMass} كجم` : "غير متاح"}</strong>
              </li>
            </ul>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">Forecast</div>
            <div className="text-sm text-text2 mb-4">
              بالاعتماد على التوجه الحالي، الوصول إلى الهدف <strong>{target} كجم</strong> متوقع خلال حوالي{" "}
              <strong>{projectionWeeks} أسبوع</strong>.
            </div>
            <div className="h-3 rounded-full bg-surface2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-gold2 to-emerald2"
                style={{
                  width: `${Math.max(0, Math.min(100, ((currentWeight - 60.9) / (75 - 60.9)) * 100))}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-text3 mt-1">
              <span>60.9 كجم</span>
              <span>75 كجم</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
