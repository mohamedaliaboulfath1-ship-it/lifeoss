"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageUnfold, SectionReveal } from "@/components/motion/unfold-reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { AreasHero } from "@/components/areas/areas-hero";
import { AreaPremiumCard } from "@/components/areas/area-premium-card";
import { AreasParaSection } from "@/components/areas/areas-para-section";
import { MotionModal } from "@/components/motion/motion";
import { useAreasOverview } from "@/hooks/queries/use-areas-overview";
import { queryKeys } from "@/lib/query/keys";
import { buildOverviewParaGraph } from "@/lib/areas/para-graph";

const EMPTY_STATS = {
  lifeScore: 0,
  activeGoals: 0,
  activeProjects: 0,
  habits: 0,
  tasksThisWeek: 0,
  areasNeedingAttention: 0,
};

export function AreasIntelligenceView() {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching } = useAreasOverview();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nameAr: "", slug: "", icon: "📌", color: "#94a3b8" });

  const previews = data?.previews ?? [];
  const stats = data?.stats ?? EMPTY_STATS;
  const loading = isLoading && !data;

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
    await queryClient.invalidateQueries({ queryKey: queryKeys.areasOverview });
  }

  const paraGraph = useMemo(() => buildOverviewParaGraph(previews), [previews]);

  return (
    <PageUnfold className="space-y-8 pb-10 max-w-[1600px] mx-auto">
      <AreasHero stats={stats} loading={loading} />

      <SectionReveal index={1}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-lg font-bold">مجالات الحياة</h2>
            <p className="text-xs text-text3 mt-0.5">
              انقر على أي مجال لفتح مركز القيادة
              {isFetching && data ? " · يتم التحديث…" : ""}
            </p>
          </div>
          <Button variant="gold" size="sm" onClick={() => setModal(true)}>
            + مجال مخصص
          </Button>
        </div>
      </SectionReveal>

      <SectionReveal index={2}>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[280px] skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {previews.map((p, i) => (
              <AreaPremiumCard key={p.id} preview={p} index={i} />
            ))}
          </div>
        )}
      </SectionReveal>

      <SectionReveal index={3}>
        <div className="space-y-3">
          <div>
            <h2 className="font-display text-lg font-bold">خريطة PARA</h2>
            <p className="text-xs text-text3 mt-0.5">
              Area → Goals → Projects → Tasks → Habits → Resources
            </p>
          </div>
          {previews.length > 0 && (
            <AreasParaSection nodes={paraGraph.nodes} edges={paraGraph.edges} height={420} />
          )}
        </div>
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
    </PageUnfold>
  );
}
