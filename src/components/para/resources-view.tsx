"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SYSTEM_DOMAINS } from "@/lib/domains";

interface Resource {
  id: string;
  title: string;
  resourceType: string;
  domainId?: string;
  url?: string;
  content?: string;
  status: string;
}

const TYPE_LABELS: Record<string, string> = {
  note: "📝 ملاحظة",
  link: "🔗 رابط",
  doc: "📄 مستند",
  reference: "📌 مرجع",
};

export function ResourcesView() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    resourceType: "reference",
    domainId: "domain_learning",
    url: "",
    content: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/resources");
    const json = await res.json().catch(() => ({}));
    if (json.migrationRequired) setMigrationRequired(true);
    setResources(json.resources ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!form.title.trim()) return;
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ title: "", resourceType: "reference", domainId: "domain_learning", url: "", content: "" });
    void load();
  }

  async function remove(id: string) {
    await fetch(`/api/resources?id=${id}`, { method: "DELETE" });
    void load();
  }

  if (loading) return <div className="h-48 skeleton-shimmer rounded-2xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="موارد PARA"
        subtitle="Resources — مراجع · روابط · ملاحظات مرتبطة بالمجالات"
        actionLabel="+ مورد جديد"
        onAction={() => setShowForm(true)}
      />

      {migrationRequired && (
        <Card className="p-4 border-amber2/40 bg-amber2/5 text-sm">
          شغّل migration <code className="text-xs">014_para_habit_system.sql</code> في Supabase لتفعيل الموارد.
        </Card>
      )}

      {!resources.length ? (
        <EmptyState
          icon="📌"
          title="لا موارد بعد"
          description="أضف مراجع وروابط وملاحظات مرتبطة بمجالاتك وأهدافك"
          actionLabel="إضافة مورد"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r, i) => {
            const domain = SYSTEM_DOMAINS.find((d) => d.id === r.domainId);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-4 glass-premium hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-[10px] text-text3">{TYPE_LABELS[r.resourceType] ?? r.resourceType}</div>
                      <div className="font-bold text-sm mt-0.5">{r.title}</div>
                      {domain && (
                        <div className="text-[10px] text-text3 mt-1">{domain.icon} {domain.nameAr}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="text-text3 hover:text-red2 text-xs opacity-0 group-hover:opacity-100"
                    >
                      حذف
                    </button>
                  </div>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-gold2 mt-2 block truncate hover:underline">
                      {r.url}
                    </a>
                  )}
                  {r.content && <p className="text-xs text-text3 mt-2 line-clamp-2">{r.content}</p>}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-md p-6 space-y-4 glass-premium">
            <h3 className="font-bold text-gold2">مورد PARA جديد</h3>
            <div>
              <Label>العنوان</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>النوع</Label>
              <select
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm"
                value={form.resourceType}
                onChange={(e) => setForm({ ...form, resourceType: e.target.value })}
              >
                <option value="reference">مرجع</option>
                <option value="link">رابط</option>
                <option value="note">ملاحظة</option>
                <option value="doc">مستند</option>
              </select>
            </div>
            <div>
              <Label>المجال</Label>
              <select
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm"
                value={form.domainId}
                onChange={(e) => setForm({ ...form, domainId: e.target.value })}
              >
                {SYSTEM_DOMAINS.map((d) => (
                  <option key={d.id} value={d.id}>{d.icon} {d.nameAr}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>رابط (اختياري)</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} dir="ltr" />
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Input value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>إلغاء</Button>
              <Button variant="gold" size="sm" onClick={save}>حفظ</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
