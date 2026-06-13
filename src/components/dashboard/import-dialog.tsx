"use client";

import { useState } from "react";
import { AppModal } from "@/components/ui/app-modal";

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
    <AppModal
      open={open}
      onClose={onClose}
      title="استيراد من LifeOS HTML"
      icon="📥"
      size="md"
      onSave={handleImport}
      saveLabel="استيراد"
      saving={loading}
      saveDisabled={!json.trim()}
    >
      <p className="text-text3 text-xs">
        الصق محتوى localStorage (مفتاح lifeos_v3) أو كائن JSON الكامل من
        أداة التصدير.
      </p>
      <textarea
        className="w-full h-40 bg-surface2 border border-border rounded-sm p-3 text-xs font-mono text-text resize-none focus:outline-none focus:border-gold/50 transition-colors"
        value={json}
        onChange={(e) => setJson(e.target.value)}
      />
      {status && <p className="text-xs">{status}</p>}
    </AppModal>
  );
}
