"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { UserTimeSettings } from "@/types/time";

interface Props {
  settings: UserTimeSettings;
  onSaved: (s: UserTimeSettings) => void;
}

export function ScheduleSettingsPanel({ settings, onSaved }: Props) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/time/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.settings) onSaved(json.settings);
    setSaving(false);
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="text-sm font-bold">⏰ جدول الحياة</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><Label>نوم (ساعات)</Label><Input type="number" value={form.sleepHours} onChange={(e) => setForm({ ...form, sleepHours: +e.target.value })} /></div>
        <div><Label>تنقل (دقائق)</Label><Input type="number" value={form.commuteMinutes} onChange={(e) => setForm({ ...form, commuteMinutes: +e.target.value })} /></div>
        <div><Label>بداية العمل</Label><Input value={form.workStart} onChange={(e) => setForm({ ...form, workStart: e.target.value })} /></div>
        <div><Label>نهاية العمل</Label><Input value={form.workEnd} onChange={(e) => setForm({ ...form, workEnd: e.target.value })} /></div>
        <div><Label>الوصول للمنزل</Label><Input value={form.homeArrival} onChange={(e) => setForm({ ...form, homeArrival: e.target.value })} /></div>
        <div><Label>سبت: بداية</Label><Input value={form.satWorkStart} onChange={(e) => setForm({ ...form, satWorkStart: e.target.value })} /></div>
        <div><Label>سبت: نهاية</Label><Input value={form.satWorkEnd} onChange={(e) => setForm({ ...form, satWorkEnd: e.target.value })} /></div>
      </div>
      <p className="text-[10px] text-text3">الأحد–الخميس: عمل · الجمعة: إجازة · السبت: دوام جزئي</p>
      <Button variant="gold" onClick={save} disabled={saving}>{saving ? "..." : "حفظ الجدول"}</Button>
    </Card>
  );
}
