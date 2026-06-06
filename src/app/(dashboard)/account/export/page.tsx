"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/toast-context";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function AccountExportPage() {
  const { toast } = useToast();
  const { data } = useLifeOS();

  async function exportJson() {
    try {
      const res = await fetch("/api/v1/export?format=json");
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lifeos-export-${data?.currentYear ?? "data"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("تم التصدير", "success");
    } catch {
      toast("فشل التصدير", "error");
    }
  }

  return (
    <Card className="p-6 space-y-4 animate-fade-up">
      <h1 className="text-lg font-bold text-gold2">تصدير البيانات</h1>
      <p className="text-text3 text-sm">
        حمّل نسخة كاملة من بياناتك بصيغة JSON — للنسخ الاحتياطي أو النقل.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="gold" onClick={exportJson}>
          تصدير JSON
        </Button>
        <Button variant="ghost" onClick={() => (window.location.href = "/settings/import")}>
          استيراد بيانات
        </Button>
      </div>
    </Card>
  );
}
