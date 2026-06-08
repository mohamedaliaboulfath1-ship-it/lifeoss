"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/contexts/toast-context";
import { today } from "@/lib/utils";

export type BodyGoal = "gain" | "lose" | "recomp" | "maintain" | "athletic";

export interface BodyPlan {
  weeklyGainTarget?: number;
  workoutProgram?: string;
  dietPlan?: string;
  dietNotes?: string;
  bodyGoal?: BodyGoal;
}

const BODY_GOALS: { id: BodyGoal; label: string }[] = [
  { id: "gain", label: "زيادة وزن (Bulk)" },
  { id: "lose", label: "خسارة وزن (Cut)" },
  { id: "recomp", label: "إعادة تشكيل (Recomp)" },
  { id: "maintain", label: "ثبات" },
  { id: "athletic", label: "أداء رياضي" },
];

interface Props {
  profile: {
    startWeight?: number | null;
    targetWeight?: number | null;
    currentWeight?: number | null;
    height?: number | null;
    dailyCalories?: number | null;
    proteinTarget?: number | null;
    carbsTarget?: number | null;
    fatsTarget?: number | null;
    bodyPlan?: BodyPlan;
  };
  onSaved: () => void;
}

export function BodyPlanPanel({ profile, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    currentWeight: profile.currentWeight?.toString() ?? "",
    startWeight: profile.startWeight?.toString() ?? "",
    targetWeight: profile.targetWeight?.toString() ?? "75",
    height: profile.height?.toString() ?? "",
    weeklyGain: String(profile.bodyPlan?.weeklyGainTarget ?? 0.5),
    bodyGoal: profile.bodyPlan?.bodyGoal ?? "gain",
    calories: String(profile.dailyCalories ?? 3000),
    protein: String(profile.proteinTarget ?? 130),
    carbs: String(profile.carbsTarget ?? 350),
    fats: String(profile.fatsTarget ?? 90),
    workoutProgram: profile.bodyPlan?.workoutProgram ?? "PPLUL",
    dietPlan: profile.bodyPlan?.dietPlan ?? "Bulk — سعرات عالية",
    dietNotes: profile.bodyPlan?.dietNotes ?? "",
  });

  async function save() {
    setSaving(true);
    try {
      const currentW = parseFloat(form.currentWeight);
      const startW = parseFloat(form.startWeight);
      const targetW = parseFloat(form.targetWeight);

      if (currentW > 0) {
        await fetch("/api/weight", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weight: currentW }),
        });
      }

      const res = await fetch("/api/data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            startWeight: startW > 0 ? startW : undefined,
            targetWeight: targetW > 0 ? targetW : undefined,
            currentWeight: currentW > 0 ? currentW : undefined,
            height: form.height ? parseFloat(form.height) : undefined,
            dailyCalories: parseInt(form.calories, 10) || undefined,
            proteinTarget: parseInt(form.protein, 10) || undefined,
            carbsTarget: parseInt(form.carbs, 10) || undefined,
            fatsTarget: parseInt(form.fats, 10) || undefined,
            bodyPlan: {
              weeklyGainTarget: parseFloat(form.weeklyGain) || 0.5,
              workoutProgram: form.workoutProgram,
              dietPlan: form.dietPlan,
              dietNotes: form.dietNotes,
              bodyGoal: form.bodyGoal,
            },
            weeklyGainTarget: parseFloat(form.weeklyGain) || 0.5,
            bodyGoal: form.bodyGoal,
          },
        }),
      });

      if (!res.ok) throw new Error("fail");
      toast("تم حفظ خطتك بالكامل", "success");
      onSaved();
    } catch {
      toast("فشل الحفظ", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5 space-y-5 border-gold/30">
      <div>
        <h3 className="font-bold text-gold2">⚙️ خطتي — الوزن والتغذية والتمارين</h3>
        <p className="text-xs text-text3 mt-1">
          كل الأرقام هنا من إدخالك أنت. لا توجد قيم افتراضية مخفية.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>الوزن الحالي (كجم) *</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="مثال: 62"
            value={form.currentWeight}
            onChange={(e) => setForm({ ...form, currentWeight: e.target.value })}
          />
        </div>
        <div>
          <Label>وزن البداية</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="عند بدء الرحلة"
            value={form.startWeight}
            onChange={(e) => setForm({ ...form, startWeight: e.target.value })}
          />
        </div>
        <div>
          <Label>الهدف (كجم)</Label>
          <Input
            type="number"
            step="0.1"
            value={form.targetWeight}
            onChange={(e) => setForm({ ...form, targetWeight: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>هدف الجسم</Label>
        <select
          className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
          value={form.bodyGoal}
          onChange={(e) => setForm({ ...form, bodyGoal: e.target.value as BodyGoal })}
        >
          {BODY_GOALS.map((g) => (
            <option key={g.id} value={g.id}>{g.label}</option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>الطول (سم)</Label>
          <Input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
        </div>
        <div>
          <Label>معدل الزيادة الأسبوعي المستهدف (كجم)</Label>
          <Input
            type="number"
            step="0.05"
            value={form.weeklyGain}
            onChange={(e) => setForm({ ...form, weeklyGain: e.target.value })}
          />
          <p className="text-[10px] text-text3 mt-1">يُستخدم لحساب: كم متبقي ومتى تصل للهدف</p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="text-sm font-bold mb-3">🍽️ النظام الغذائي</div>
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <div>
            <Label>اسم الخطة</Label>
            <Input value={form.dietPlan} onChange={(e) => setForm({ ...form, dietPlan: e.target.value })} />
          </div>
          <div>
            <Label>ملاحظات</Label>
            <Input value={form.dietNotes} onChange={(e) => setForm({ ...form, dietNotes: e.target.value })} placeholder="شوفان، أرز، زيت زيتون..." />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><Label>سعرات</Label><Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} /></div>
          <div><Label>بروتين</Label><Input type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} /></div>
          <div><Label>كربوهيدرات</Label><Input type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} /></div>
          <div><Label>دهون</Label><Input type="number" value={form.fats} onChange={(e) => setForm({ ...form, fats: e.target.value })} /></div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="text-sm font-bold mb-3">🏋️ برنامج التمارين</div>
        <Label>اسم البرنامج / النظام</Label>
        <Input
          value={form.workoutProgram}
          onChange={(e) => setForm({ ...form, workoutProgram: e.target.value })}
          placeholder="PPLUL، Full Body، Push Pull Legs..."
        />
        <p className="text-[10px] text-text3 mt-1">
          لإضافة تمارين مخصصة: صفحة التمارين → تبويب «تماريني»
        </p>
      </div>

      <Button variant="gold" onClick={save} disabled={saving}>
        {saving ? "جاري الحفظ..." : "حفظ خطتي"}
      </Button>
      <p className="text-[10px] text-text3">آخر تحديث وزن: {today()}</p>
    </Card>
  );
}
