"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MotionModal } from "@/components/motion/motion";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportDialog({ open, onClose, onSuccess }: ImportDialogProps) {
  const [json, setJson] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    setStatus(null);
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <MotionModal open={open} onClose={onClose}>
      <div className="bg-surface border border-border2 rounded-[10px] max-w-lg w-full p-6 shadow-premium-lg">
        <h2 className="font-display text-xl font-black text-gold2 mb-2">
          استيراد من LifeOS HTML
        </h2>
        <p className="text-text3 text-xs mb-4">
          الصق محتوى localStorage (مفتاح lifeos_v3) أو كائن JSON الكامل من
          أداة التصدير.
        </p>
        <textarea
          className="w-full h-40 bg-surface2 border border-border rounded-sm p-3 text-xs font-mono text-text resize-none focus:outline-none focus:border-gold/50 transition-colors"
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
        {status && <p className="text-xs mt-2">{status}</p>}
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="gold" onClick={handleImport} loading={loading}>
            استيراد
          </Button>
        </div>
      </div>
    </MotionModal>
  );
}
