"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportDialog({ open, onClose, onSuccess }: ImportDialogProps) {
  const [json, setJson] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  if (!open) return null;

  async function handleImport() {
    setStatus(null);
    try {
      const backup = JSON.parse(json);
      const res = await fetch("/api/v1/import/lifeos-v1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "import failed");
      setStatus(`✅ تم الاستيراد — ${result.totals?.inserted ?? 0} جديد، ${result.totals?.updated ?? 0} محدّث`);
      onSuccess?.();
      setTimeout(onClose, 1200);
    } catch {
      setStatus("❌ JSON غير صالح أو فشل الاستيراد");
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border2 rounded-[10px] max-w-lg w-full p-6 animate-fade-up">
        <h2 className="font-display text-xl font-black text-gold2 mb-2">
          استيراد من LifeOS HTML
        </h2>
        <p className="text-text3 text-xs mb-4">
          الصق محتوى localStorage (مفتاح lifeos_v3) أو كائن JSON الكامل من
          أداة التصدير.
        </p>
        <textarea
          className="w-full h-40 bg-surface2 border border-border rounded-sm p-3 text-xs font-mono text-text resize-none focus:outline-none focus:border-gold/50"
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder='{"profile":{...},"years":{...}}'
          dir="ltr"
        />
        {status && <p className="text-sm mt-2">{status}</p>}
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="gold" onClick={handleImport}>
            استيراد
          </Button>
        </div>
      </div>
    </div>
  );
}
