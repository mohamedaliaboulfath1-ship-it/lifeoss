"use client";

import { DashboardReveal, SectionReveal, CardUnfold } from "@/components/motion/unfold-reveal";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { AreaPreviewCard } from "@/components/areas/area-preview-card";
import { PremiumSurface } from "@/components/motion/premium-surface";
import { LayoutAnimateList } from "@/components/motion/layout-animate-list";
import { MotionModal } from "@/components/motion/motion";
import type { AreaPreview } from "@/types/areas";

export function AreasIntelligenceView() {
  const [previews, setPreviews] = useState<AreaPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nameAr: "", slug: "", icon: "📌", color: "#94a3b8" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/areas/overview");
    const json = await res.json().catch(() => null);
    setPreviews(json?.previews ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener("focus", refresh);
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 30_000);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(poll);
    };
  }, [load]);

  async function addArea() {
    if (!form.nameAr.trim()) return;
    const slug = form.slug || form.nameAr.replace(/\s+/g, "_").toLowerCase();
    await fetch("/api/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug }),
    });
    setModal(false);
    setForm({ nameAr: "", slug: "", icon: "📌", color: "#94a3b8" });
    await load();
  }

  const avgScore = previews.length
    ? Math.round(previews.reduce((s, p) => s + p.healthScore, 0) / previews.length)
    : 0;

  return (
    <DashboardReveal>
      <DashboardReveal.Header>
      <PageHeader
        title="Life Areas Intelligence Center"
        subtitle="كل مجال = مركز قيادة — أين أنت؟ ماذا تفعل؟ ما الخطوة التالية؟"
      />

      <PremiumSurface variant="gradient-indigo" className="p-5 flex flex-wrap gap-6 items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text3 mb-1">Life Areas Intelligence</p>
          <div className="text-3xl font-black text-gold2">{avgScore}%</div>
          <div className="text-xs text-text3">متوسط صحة الحياة</div>
        </div>
        <div className="flex gap-4 text-sm text-text3">
          <span>{previews.length} مجالات</span>
          <span>{previews.reduce((s, p) => s + p.activeGoals, 0)} أهداف نشطة</span>
          <span>{previews.filter((p) => p.needsAttention.length).length} تحتاج انتباه</span>
        </div>
      </PremiumSurface>
      </DashboardReveal.Header>

      <DashboardReveal.Kpis columns="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 skeleton-shimmer rounded-[10px]" />
          ))}
        </div>
      ) : (
        <LayoutAnimateList className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {previews.map((p) => (
            <AreaPreviewCard key={p.id} preview={p} />
          ))}
        </LayoutAnimateList>
      )}
      </DashboardReveal.Kpis>

      <SectionReveal index={2}>
      <Button variant="gold" onClick={() => setModal(true)}>+ مجال مخصص</Button>
      </SectionReveal>

      <MotionModal open={modal} onClose={() => setModal(false)}>
        <Card className="w-full max-w-sm p-6 space-y-4 glass-premium">
          <h3 className="font-bold">مجال جديد</h3>
          <div><Label>الاسم</Label><Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></div>
          <div><Label>أيقونة</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setModal(false)}>إلغاء</Button>
            <Button variant="gold" onClick={addArea}>حفظ</Button>
          </div>
        </Card>
      </MotionModal>
    </DashboardReveal>
  );
}
