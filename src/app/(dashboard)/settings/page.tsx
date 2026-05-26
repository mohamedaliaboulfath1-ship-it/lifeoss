"use client";

import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme, type ThemeMode } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { useLifeOS } from "@/contexts/lifeos-context";

const THEMES: { id: ThemeMode; label: string }[] = [
  { id: "dark", label: "داكن" },
  { id: "light", label: "فاتح" },
  { id: "system", label: "تلقائي (النظام)" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { data } = useLifeOS();

  async function exportJson() {
    try {
      const res = await fetch("/api/data");
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lifeos-backup-${data?.currentYear ?? "export"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("تم تصدير النسخة الاحتياطية", "success");
    } catch {
      toast("فشل التصدير", "error");
    }
  }

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7 space-y-6 animate-fade-up max-w-2xl">
        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gold2">المظهر</h2>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <Button
                key={t.id}
                variant={theme === t.id ? "gold" : "ghost"}
                size="sm"
                onClick={() => setTheme(t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gold2">النسخ الاحتياطي</h2>
          <p className="text-text3 text-sm">
            صدّر كل بياناتك كملف JSON — احفظه بأمان خارج التطبيق.
          </p>
          <Button variant="gold" onClick={exportJson}>
            تصدير JSON
          </Button>
        </Card>

        <Card className="p-5 space-y-2">
          <h2 className="font-bold text-gold2">الحساب</h2>
          <p className="text-sm text-text2">
            {data?.profile.displayName} · سنة {data?.currentYear}
          </p>
          <p className="text-xs text-text3">
            الإشعارات الذكية والبريد الإلكتروني — قريباً في المرحلة التالية.
          </p>
        </Card>
      </div>
    </>
  );
}
