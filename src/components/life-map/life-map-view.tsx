"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import type { LifeMapNode, LifeMapPayload } from "@/lib/life-map/build-global-graph";

const TYPE_META: Record<string, { color: string; icon: string; label: string }> = {
  goal: { color: "var(--gold)", icon: "🎯", label: "هدف" },
  project: { color: "var(--sky)", icon: "📁", label: "مشروع" },
  task: { color: "var(--amber2)", icon: "✅", label: "مهمة" },
  habit: { color: "var(--emerald)", icon: "🔄", label: "عادة" },
  book: { color: "var(--purple)", icon: "📚", label: "كتاب" },
  skill: { color: "var(--pink)", icon: "⚡", label: "مهارة" },
  course: { color: "var(--teal)", icon: "🎓", label: "دورة" },
  cert: { color: "var(--coral)", icon: "🏅", label: "شهادة" },
};

export function LifeMapView() {
  const [data, setData] = useState<LifeMapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<LifeMapNode | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/life-map");
    const json = await res.json().catch(() => null);
    if (json?.nodes) setData(json as LifeMapPayload);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.nodes;
    return data.nodes.filter((n) => n.type === filter);
  }, [data, filter]);

  if (loading && !data) {
    return <div className="h-64 skeleton-shimmer rounded-2xl" />;
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="خريطة الحياة"
        subtitle="Life Map — رؤية · أهداف · مشاريع · عادات · مهام · كتب · مهارات"
      />

      {stats && (
        <div className="flex flex-wrap gap-2">
          {[
            { k: "visions", label: "رؤى", v: stats.visions },
            { k: "goals", label: "أهداف", v: stats.goals },
            { k: "projects", label: "مشاريع", v: stats.projects },
            { k: "habits", label: "عادات", v: stats.habits },
            { k: "tasks", label: "مهام", v: stats.tasks },
            { k: "books", label: "كتب", v: stats.books },
            { k: "skills", label: "مهارات", v: stats.skills },
          ].map((s) => (
            <span key={s.k} className="text-xs px-3 py-1.5 rounded-full glass-premium border border-border/40">
              <span className="text-text3">{s.label}</span>{" "}
              <span className="font-mono font-bold text-gold2">{s.v}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {["all", "goal", "project", "habit", "task", "book", "skill"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              filter === f ? "bg-gold/20 text-gold2 border border-gold/40" : "bg-surface2 text-text3 border border-border/40 hover:border-gold/20"
            }`}
          >
            {f === "all" ? "الكل" : TYPE_META[f]?.label ?? f}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 min-h-[420px] glass-premium">
          <div className="text-sm font-bold mb-4 text-text2">الشبكة التفاعلية</div>
          {!filtered.length ? (
            <p className="text-text3 text-sm text-center py-12">أضف أهدافاً وعادات لبناء خريطة حياتك</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((n, i) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.goal;
                  return (
                    <motion.button
                      key={n.id}
                      type="button"
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelected(n)}
                      className={`px-4 py-3 rounded-xl border text-right min-w-[120px] max-w-[180px] transition-shadow hover:shadow-lg hover:-translate-y-0.5 ${
                        selected?.id === n.id ? "ring-2 ring-gold/50" : ""
                      }`}
                      style={{
                        borderColor: `${meta.color}50`,
                        background: `${meta.color}12`,
                      }}
                    >
                      <div className="text-lg">{meta.icon}</div>
                      <div className="text-xs font-medium truncate mt-1">{n.label}</div>
                      <div className="text-[10px] text-text3">{meta.label}</div>
                      {n.progress != null && (
                        <div className="text-[10px] font-mono text-gold2 mt-1">{n.progress}%</div>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </Card>

        <Card className="p-5 glass-premium">
          <div className="text-sm font-bold mb-3">التفاصيل</div>
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
              <div className="text-lg">{TYPE_META[selected.type]?.icon}</div>
              <div className="font-bold">{selected.label}</div>
              <div className="text-xs text-text3">{TYPE_META[selected.type]?.label}</div>
              {selected.progress != null && (
                <div className="text-sm">التقدم: <span className="font-mono text-gold2">{selected.progress}%</span></div>
              )}
              {selected.domainSlug && (
                <Link href={`/areas/${selected.domainSlug}`} className="text-xs text-gold2 hover:underline block">
                  → مجال {selected.domainSlug}
                </Link>
              )}
              {selected.href && (
                <Link href={selected.href} className="inline-block mt-2 text-sm px-4 py-2 rounded-lg bg-gold/15 text-gold2 hover:bg-gold/25">
                  فتح
                </Link>
              )}
              {data?.edges.filter((e) => e.from === selected.id || e.to === selected.id).length ? (
                <div className="pt-2 border-t border-border/40">
                  <div className="text-xs text-text3 mb-1">مرتبط بـ:</div>
                  {data.edges
                    .filter((e) => e.from === selected.id || e.to === selected.id)
                    .slice(0, 6)
                    .map((e) => {
                      const otherId = e.from === selected.id ? e.to : e.from;
                      const other = data.nodes.find((n) => n.id === otherId);
                      return other ? (
                        <button
                          key={`${e.from}-${e.to}`}
                          type="button"
                          onClick={() => setSelected(other)}
                          className="block text-xs text-left w-full py-1 hover:text-gold2 truncate"
                        >
                          {TYPE_META[other.type]?.icon} {other.label}
                        </button>
                      ) : null;
                    })}
                </div>
              ) : null}
            </motion.div>
          ) : (
            <p className="text-text3 text-sm">اضغط على أي عقدة لعرض التفاصيل والروابط</p>
          )}
        </Card>
      </div>
    </div>
  );
}
