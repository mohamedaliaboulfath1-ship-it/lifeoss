"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/toast-context";
import { useLifeOS } from "@/contexts/lifeos-context";
import type { ImportReport } from "@/lib/import/v1/types";

export default function ImportSettingsPage() {
  const { toast } = useToast();
  const { refresh } = useLifeOS();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [preview, setPreview] = useState<{
    storeCounts: { store: string; count: number }[];
    totalRecords: number;
  } | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setReport(null);
    setPreview(null);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      const dryRes = await fetch("/api/v1/import/lifeos-v1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup, dryRun: true }),
      });
      if (dryRes.ok) {
        const dry = await dryRes.json();
        setPreview({
          storeCounts: dry.storeCounts ?? [],
          totalRecords: dry.totalRecords ?? 0,
        });
      }

      const res = await fetch("/api/v1/import/lifeos-v1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? data.hint ?? "فشل الاستيراد");
      }
      setReport(data as ImportReport);
      toast(
        `تم الاستيراد — ${data.totals.inserted} جديد، ${data.totals.updated} محدّث`,
        data.success ? "success" : "error"
      );
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "فشل الاستيراد", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7 space-y-6 animate-fade-up max-w-3xl">
        <div className="flex items-center gap-3 text-sm text-text3">
          <Link href="/settings" className="hover:text-gold2">
            الإعدادات
          </Link>
          <span>/</span>
          <span className="text-text2">استيراد LifeOS v1</span>
        </div>

        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gold2 text-lg">استيراد من LifeOS_1.html</h2>
          <p className="text-text3 text-sm leading-relaxed">
            صدّر نسخة احتياطية من الملف القديم:{" "}
            <strong>الإعدادات → تصدير كل البيانات</strong> — ثم ارفع ملف{" "}
            <code className="text-gold3">LifeOS_Backup_*.json</code>
          </p>
          <ul className="text-xs text-text3 space-y-1 list-disc list-inside">
            <li>يدعم جميع الـ 22 store من IndexedDB</li>
            <li>استيراد متكرر آمن (idempotent) عبر legacy_id</li>
            <li>يدمج البيانات مع الموجود — لا يحذف سجلاتك الحالية</li>
          </ul>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Button
            variant="gold"
            disabled={loading}
            onClick={() => fileRef.current?.click()}
          >
            {loading ? "جاري الاستيراد…" : "اختر ملف النسخة الاحتياطية"}
          </Button>
        </Card>

        {preview && !report && (
          <Card className="p-5">
            <h3 className="font-bold text-text2 mb-3">معاينة الملف</h3>
            <p className="text-sm text-text3 mb-2">
              إجمالي السجلات: <strong>{preview.totalRecords}</strong>
            </p>
          </Card>
        )}

        {report && (
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap gap-4">
              <Stat label="نسبة النقل" value={`${report.dataTransferRate}%`} />
              <Stat label="جديد" value={String(report.totals.inserted)} />
              <Stat label="محدّث" value={String(report.totals.updated)} />
              <Stat label="متخطى" value={String(report.totals.skipped)} />
              <Stat label="أخطاء" value={String(report.totals.errors)} color="var(--coral)" />
            </div>

            <p className="text-xs text-text3">
              سنة الاستيراد: {report.importYear} · الإصدار: {report.version ?? "—"} ·
              التصدير: {report.exportedAt ?? "—"}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text3 border-b border-border">
                    <th className="text-right py-2">Store</th>
                    <th className="text-right py-2">الجدول</th>
                    <th className="text-right py-2">جديد</th>
                    <th className="text-right py-2">محدّث</th>
                    <th className="text-right py-2">متخطى</th>
                    <th className="text-right py-2">أخطاء</th>
                  </tr>
                </thead>
                <tbody>
                  {report.stores.map((s) => (
                    <tr key={s.store} className="border-b border-border/50">
                      <td className="py-2 font-mono">{s.store}</td>
                      <td className="py-2 text-text3">{s.targetTable}</td>
                      <td className="py-2 text-emerald">{s.inserted}</td>
                      <td className="py-2 text-sky">{s.updated}</td>
                      <td className="py-2 text-amber2">{s.skipped}</td>
                      <td className="py-2 text-coral">{s.errors.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {report.skippedStores.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-amber2 mb-2">Stores متخطاة</h4>
                <ul className="text-xs text-text3 space-y-1">
                  {report.skippedStores.map((s) => (
                    <li key={s.store}>
                      <strong>{s.store}</strong>: {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.warnings.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-amber2 mb-2">تحذيرات</h4>
                <ul className="text-xs text-text3 space-y-1">
                  {report.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.stores.some((s) => s.errors.length > 0) && (
              <div>
                <h4 className="text-sm font-bold text-coral mb-2">أخطاء التفصيلية</h4>
                <ul className="text-xs text-text3 space-y-1 max-h-40 overflow-y-auto">
                  {report.stores.flatMap((s) =>
                    s.errors.map((e, i) => (
                      <li key={`${s.store}-${i}`}>
                        [{s.store}] {e.legacyId ? `#${e.legacyId}: ` : ""}
                        {e.message}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <div className="text-[10px] text-text3 uppercase">{label}</div>
      <div className="text-xl font-bold" style={{ color: color ?? "var(--gold2)" }}>
        {value}
      </div>
    </div>
  );
}
