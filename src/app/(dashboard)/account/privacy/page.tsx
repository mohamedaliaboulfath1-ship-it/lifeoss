"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/toast-context";

export default function AccountPrivacyPage() {
  const { toast } = useToast();
  const [profileVisible, setProfileVisible] = useState(true);
  const [analyticsSharing, setAnalyticsSharing] = useState(false);
  const [exportAllowed, setExportAllowed] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((json) => {
        const s = (json.settings?.privacy ?? {}) as Record<string, boolean>;
        setProfileVisible(s.profileVisible ?? true);
        setAnalyticsSharing(s.analyticsSharing ?? false);
        setExportAllowed(s.exportAllowed ?? true);
      });
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          privacy: { profileVisible, analyticsSharing, exportAllowed },
        },
      }),
    });
    setSaving(false);
    toast(res.ok ? "تم حفظ إعدادات الخصوصية" : "فشل الحفظ", res.ok ? "success" : "error");
  }

  return (
    <Card className="p-6 space-y-4 animate-fade-up">
      <h1 className="text-lg font-bold text-gold2">الخصوصية</h1>
      <div className="space-y-3 text-sm">
        <label className="flex items-center gap-3 p-3 border border-border rounded-sm cursor-pointer">
          <input
            type="checkbox"
            checked={profileVisible}
            onChange={(e) => setProfileVisible(e.target.checked)}
            className="accent-[var(--gold)]"
          />
          <span>إظهار الاسم في لوحة التحكم والتقارير</span>
        </label>
        <label className="flex items-center gap-3 p-3 border border-border rounded-sm cursor-pointer">
          <input
            type="checkbox"
            checked={analyticsSharing}
            onChange={(e) => setAnalyticsSharing(e.target.checked)}
            className="accent-[var(--gold)]"
          />
          <span>مشاركة بيانات مجمّعة لتحسين التحليلات (اختياري)</span>
        </label>
        <label className="flex items-center gap-3 p-3 border border-border rounded-sm cursor-pointer">
          <input
            type="checkbox"
            checked={exportAllowed}
            onChange={(e) => setExportAllowed(e.target.checked)}
            className="accent-[var(--gold)]"
          />
          <span>السماح بتصدير البيانات من الحساب</span>
        </label>
      </div>
      <Button variant="gold" onClick={save} disabled={saving}>
        {saving ? "جاري الحفظ..." : "حفظ"}
      </Button>
    </Card>
  );
}
