"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import type { ParaArea } from "@/types/para";

export function AreasView() {
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

      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold">مجال جديد</h3>
            <div><Label>الاسم</Label><Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></div>
            <div><Label>أيقونة</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setModal(false)}>إلغاء</Button>
              <Button variant="gold" onClick={addArea}>حفظ</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
