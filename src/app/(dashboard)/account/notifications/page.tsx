"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/toast-context";

const PREFS = [
  { key: "habitReminders", label: "تذكير العادات اليومية", desc: "إشعار عند عادات غير مكتملة" },
  { key: "taskDeadlines", label: "مهام متأخرة", desc: "تنبيه عند اقتراب أو تجاوز الموعد" },
  { key: "weeklySummary", label: "ملخص أسبوعي", desc: "تقرير أداء كل أسبوع" },
  { key: "goalUpdates", label: "تحديثات الأهداف", desc: "عند تغيّر تقدم هدف مهم" },
  { key: "financeAlerts", label: "تنبيهات مالية", desc: "ديون وأقساط قريبة" },
  { key: "achievements", label: "إنجازات", desc: "عند تحقيق معالم جديدة" },
] as const;

type PrefKey = (typeof PREFS)[number]["key"];

export default function AccountNotificationsPage() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((json) => {
        const n = (json.notifications ?? {}) as Record<string, boolean>;
        const defaults: Record<string, boolean> = {};
        for (const p of PREFS) defaults[p.key] = n[p.key] ?? true;
        setPrefs(defaults);
      });
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifications: prefs }),
    });
    setSaving(false);
    toast(res.ok ? "تم حفظ تفضيلات الإشعارات" : "فشل الحفظ", res.ok ? "success" : "error");
  }

  return (
    <Card className="p-6 space-y-4 animate-fade-up">
      <h1 className="text-lg font-bold text-gold2">الإشعارات</h1>
      <p className="text-text3 text-sm">
        تحكّم في أنواع التنبيهات داخل التطبيق. الإشعارات تُخزَّن في جدول notifications.
      </p>
      <div className="space-y-3">
        {PREFS.map((p) => (
          <label
            key={p.key}
            className="flex items-start gap-3 p-3 rounded-sm border border-border hover:border-border2 cursor-pointer"
          >
            <input
              type="checkbox"
              className="mt-1 accent-[var(--gold)]"
              checked={prefs[p.key] ?? true}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, [p.key]: e.target.checked }))
              }
            />
            <div>
              <div className="text-sm font-medium">{p.label}</div>
              <div className="text-xs text-text3">{p.desc}</div>
            </div>
          </label>
        ))}
      </div>
      <Button variant="gold" onClick={save} disabled={saving}>
        {saving ? "جاري الحفظ..." : "حفظ التفضيلات"}
      </Button>
    </Card>
  );
}
