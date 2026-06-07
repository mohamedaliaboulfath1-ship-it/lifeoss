"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { today } from "@/lib/utils";
import type { PhotoTimelineGroup, PhotoAngle } from "@/types/wealth";

const ANGLES: { id: PhotoAngle; label: string }[] = [
  { id: "front", label: "أمام" },
  { id: "side", label: "جانب" },
  { id: "back", label: "خلف" },
];

export function ProgressPhotosPanel() {
  const [timeline, setTimeline] = useState<PhotoTimelineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [compare, setCompare] = useState<[string, string] | null>(null);
  const [upload, setUpload] = useState<{ angle: PhotoAngle; file?: File } | null>(null);
  const [meta, setMeta] = useState({ weight: "", bodyFat: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/body/photos");
    const json = await res.json().catch(() => ({}));
    setTimeline(json.timeline ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleUpload() {
    if (!upload?.file) return;
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(upload.file!);
    });
    await fetch("/api/body/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photoDate: today(),
        photoAngle: upload.angle,
        weight: meta.weight ? parseFloat(meta.weight) : undefined,
        bodyFatPct: meta.bodyFat ? parseFloat(meta.bodyFat) : undefined,
        notes: meta.notes || undefined,
        imageBase64: base64,
      }),
    });
    setUpload(null);
    setMeta({ weight: "", bodyFat: "", notes: "" });
    await load();
  }

  const compareGroups = compare
    ? timeline.filter((g) => compare.includes(g.date))
    : [];

  if (loading) return <div className="h-40 skeleton-shimmer rounded-[10px]" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ANGLES.map((a) => (
          <label key={a.id} className="cursor-pointer inline-flex items-center px-2.5 py-1 text-[11px] rounded-sm border border-border hover:bg-surface2">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setUpload({ angle: a.id, file: f });
            }} />
            📷 {a.label}
          </label>
        ))}
      </div>

      {upload && (
        <Card className="p-4 space-y-3 border-gold/30">
          <div className="text-sm font-bold">رفع صورة {ANGLES.find((a) => a.id === upload.angle)?.label}</div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>الوزن</Label><Input value={meta.weight} onChange={(e) => setMeta({ ...meta, weight: e.target.value })} /></div>
            <div><Label>دهون %</Label><Input value={meta.bodyFat} onChange={(e) => setMeta({ ...meta, bodyFat: e.target.value })} /></div>
            <div><Label>ملاحظات</Label><Input value={meta.notes} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="text-xs px-3 py-1.5 rounded-sm bg-gold text-[#1a1000] font-bold" onClick={handleUpload}>رفع إلى Supabase</button>
            <button type="button" className="text-xs px-3 py-1.5 rounded-sm border border-border" onClick={() => setUpload(null)}>إلغاء</button>
          </div>
        </Card>
      )}

      {timeline.length === 0 ? (
        <EmptyState icon="📸" title="لا صور تقدم بعد" description="ارفع صور أمام / جانب / خلف لبناء Timeline" example="يناير 2026 — Front + Side + Back" />
      ) : (
        <div className="space-y-6">
          {timeline.map((group) => (
            <Card key={group.date} className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="font-bold">{group.date}</div>
                  <div className="text-xs text-text3">
                    {group.weight ? `${group.weight} كجم` : ""}
                    {group.bodyFatPct ? ` · ${group.bodyFatPct}% دهون` : ""}
                  </div>
                </div>
                <button type="button" className="text-xs text-gold2 hover:underline" onClick={() => {
                  if (!compare) setCompare([group.date, group.date]);
                  else if (compare[0] === group.date) setCompare(null);
                  else setCompare([compare[0], group.date]);
                }}>
                  {compare?.includes(group.date) ? "✓ مقارنة" : "قارن"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {ANGLES.map((a) => {
                  const p = group.photos[a.id];
                  return (
                    <div key={a.id} className="aspect-[3/4] rounded-sm border border-border bg-surface2 overflow-hidden relative">
                      {p?.signedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.signedUrl} alt={a.label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-text3">{a.label}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {compare && compareGroups.length === 2 && (
        <Card className="p-4 border-gold/30">
          <div className="text-sm font-bold mb-3">مقارنة {compare[0]} ↔ {compare[1]}</div>
          <div className="grid grid-cols-2 gap-4">
            {compareGroups.map((g) => (
              <div key={g.date}>
                <div className="text-xs text-text3 mb-2">{g.date} — {g.weight ?? "?"} كجم</div>
                <div className="grid grid-cols-3 gap-1">
                  {ANGLES.map((a) => (
                    <div key={a.id} className="aspect-[3/4] rounded-sm border border-border overflow-hidden">
                      {g.photos[a.id]?.signedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g.photos[a.id]!.signedUrl} alt="" className="w-full h-full object-cover" />
                      ) : <div className="h-full bg-surface2" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
