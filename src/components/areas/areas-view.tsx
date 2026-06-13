"use client";

import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { useToast } from "@/contexts/toast-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import type { ParaArea } from "@/types/para";

export function AreasView() {
  const { toast } = useToast();
  const [areas, setAreas] = useState<ParaArea[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nameAr: "", slug: "", icon: "📌", color: "#94a3b8" });

  async function load() {
    const res = await fetch("/api/areas");
    if (res.ok) {
      const j = await res.json();
      setAreas(j.areas ?? []);
    }
  }

  useEffect(() => { void load(); }, []);

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
    toast("تم إضافة المجال", "success");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مناطق الحياة" subtitle="PARA — Areas: الصحة، المهنة، المال، التعلم..." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {areas.map((a) => (
          <Card key={a.id} className="p-4" style={{ borderColor: `${a.color}40` }}>
            <div className="text-2xl mb-2">{a.icon}</div>
            <div className="font-bold">{a.nameAr}</div>
            <div className="text-xs text-text3 mt-1">{a.isSystem ? "نظام" : "مخصص"}</div>
          </Card>
        ))}
      </div>
      <Button variant="gold" onClick={() => setModal(true)}>+ مجال مخصص</Button>

      <AppModal
        open={modal}
        onClose={() => setModal(false)}
        title="مجال جديد"
        icon="📌"
        size="md"
        onSave={addArea}
        saveDisabled={!form.nameAr.trim()}
      >
        <div><Label>الاسم</Label><Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></div>
        <div><Label>أيقونة</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
      </AppModal>
    </div>
  );
}
