"use client";
import { ViewShell } from "@/components/motion/view-shell";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/contexts/toast-context";
import type { YearMetrics } from "@/lib/archive/metrics";

interface SummaryRow {
  year: string;
  metrics: YearMetrics;
  updatedAt?: string;
}

interface ArchiveViewProps {
  currentYear: string;
  years: string[];
  onRefresh: () => void;
}

export function ArchiveView({ currentYear, years, onRefresh }: ArchiveViewProps) {
  const { toast } = useToast();
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);
  const [snapshots, setSnapshots] = useState<{ year: string; label: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<YearMetrics | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/archive?compare=1");
      const json = await res.json();
      if (res.ok) {
        setSummaries(json.summaries ?? []);
        setSnapshots(json.snapshots ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch(`/api/archive?preview=${currentYear}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json?.metrics && setPreview(json.metrics))
      .catch(() => {});
  }, [currentYear]);

  async function archiveYear(year: string) {
    const res = await fetch("/api/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, label: `أرشيف ${year}` }),
    });
    const json = await res.json();
    if (res.ok) {
      toast(`تم أرشفة سنة ${year}`, "success");
      load();
      onRefresh();
    } else {
      toast(json.error ?? "فشل الأرشفة", "error");
    }
  }

  const compareMetrics = summaries.length
    ? summaries
    : preview
      ? [{ year: currentYear, metrics: preview }]
      : [];

  return (
    <ViewShell>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <p className="text-text2 text-sm">
          احفظ لقطة كاملة لكل سنة — بياناتك تبقى آمنة للمقارنة طويلة المدى.
        </p>
        <Button variant="gold" size="sm" onClick={() => archiveYear(currentYear)}>
          أرشفة {currentYear}
        </Button>
      </div>

      {preview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="نقاط الانضباط"
            value={`${preview.disciplineScore}%`}
            sub={currentYear}
            color="var(--gold)"
          />
          <KpiCard
            label="الأهداف"
            value={`${preview.goalsDone}/${preview.goalsTotal}`}
            sub={`${preview.goalsAvgProgress}% متوسط`}
            color="var(--emerald)"
          />
          <KpiCard
            label="العادات"
            value={`${preview.habitsWeeklyPct}%`}
            sub="إنجاز الأسبوع"
            color="var(--sky)"
          />
          <KpiCard
            label="الوزن"
            value={
              preview.weightChange != null
                ? `${preview.weightChange > 0 ? "+" : ""}${preview.weightChange.toFixed(1)} كجم`
                : "—"
            }
            sub="تغيّر السنة"
            color="var(--purple)"
          />
        </div>
      )}

      {loading ? (
        <p className="text-text3 text-sm">جاري التحميل...</p>
      ) : summaries.length === 0 && snapshots.length === 0 ? (
        <EmptyState
          icon="📦"
          title="لا أرشيف بعد"
          description={`اضغط «أرشفة ${currentYear}» لحفظ لقطة من بياناتك الحالية`}
          actionLabel={`أرشفة ${currentYear}`}
          onAction={() => archiveYear(currentYear)}
        />
      ) : (
        <Card className="p-4 overflow-x-auto">
          <h3 className="font-bold text-sm text-gold2 mb-4">مقارنة السنوات</h3>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-text3 text-xs border-b border-border">
                <th className="text-right py-2">السنة</th>
                <th className="text-right py-2">انضباط</th>
                <th className="text-right py-2">أهداف</th>
                <th className="text-right py-2">عادات</th>
                <th className="text-right py-2">وزن</th>
                <th className="text-right py-2">تمارين</th>
                <th className="text-right py-2">كتب</th>
              </tr>
            </thead>
            <tbody>
              {compareMetrics.map((row) => {
                const m = row.metrics as YearMetrics;
                return (
                  <tr key={row.year} className="border-b border-border/50">
                    <td className="py-2 font-bold">{row.year}</td>
                    <td className="py-2">{m.disciplineScore}%</td>
                    <td className="py-2">
                      {m.goalsDone}/{m.goalsTotal}
                    </td>
                    <td className="py-2">{m.habitsWeeklyPct}%</td>
                    <td className="py-2">
                      {m.weightChange != null ? `${m.weightChange.toFixed(1)}` : "—"}
                    </td>
                    <td className="py-2">{m.workoutsCount}</td>
                    <td className="py-2">
                      {m.booksDone}/{m.booksTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {snapshots.length > 0 && (
        <Card className="p-4">
          <h3 className="font-bold text-sm mb-3">لقطات محفوظة</h3>
          <ul className="space-y-2">
            {snapshots.map((s) => (
              <li
                key={s.year}
                className="flex justify-between text-sm border-b border-border/50 py-2"
              >
                <span>{s.label ?? s.year}</span>
                <span className="text-text3 font-mono">{s.year}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4 text-text3 text-xs">
        السنوات النشطة: {years.join(" · ")} — التبديل من الشريط الجانبي يغيّر العرض دون حذف
        البيانات.
      </Card>
    </ViewShell>
  );
}
