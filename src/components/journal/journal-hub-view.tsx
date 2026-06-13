"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { JOURNAL_CATEGORIES } from "@/lib/journal/blocks";
import type { JournalEntrySummary, JournalTemplate } from "@/types/journal";
import { today } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function JournalHubView() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntrySummary[]>([]);
  const [templates, setTemplates] = useState<JournalTemplate[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [migrationRequired, setMigrationRequired] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (search.trim()) params.set("q", search.trim());
    const res = await fetch(`/api/journal?${params}`);
    const json = await res.json();
    if (json.migrationRequired) setMigrationRequired(true);
    setEntries(json.entries ?? []);
    setTemplates(json.templates ?? []);
    setLoading(false);
  }, [category, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createNote(opts?: {
    templateId?: string;
    isDaily?: boolean;
    title?: string;
  }) {
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: opts?.templateId,
        isDaily: opts?.isDaily,
        journalDate: opts?.isDaily ? today() : undefined,
        title: opts?.title,
        category: opts?.isDaily ? "journal" : "ideas",
      }),
    });
    const json = await res.json();
    if (json.id) router.push(`/journal/${json.id}`);
  }

  if (loading) return <div className="h-64 skeleton-shimmer rounded-2xl" />;

  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-8 md:p-10 glass-premium border border-gold/20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-sky/10 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-black bg-gradient-to-br from-gold via-sky2 to-gold3 bg-clip-text text-transparent">
            🧠 Journal OS
          </h1>
          <p className="text-text2 text-sm mt-2 max-w-xl">
            العقل الثاني — كتابة · تفكير · معرفة · مرتبط بأهدافك وعاداتك وكتبك
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            <Button variant="gold" size="sm" onClick={() => createNote()}>
              + مذكرة جديدة
            </Button>
            <Button variant="ghost" size="sm" onClick={() => createNote({ isDaily: true })}>
              📔 يومية اليوم
            </Button>
            <Link href="/journal/graph">
              <Button variant="ghost" size="sm">🕸️ Knowledge Graph</Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {migrationRequired && (
        <GlassCard className="p-4 border-amber2/40 text-sm">
          شغّل migration <code className="text-xs">021_journal_os.sql</code> في Supabase.
        </GlassCard>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {templates.map((tpl) => (
          <GlassCard
            key={tpl.id}
            className="p-4 cursor-pointer hover:border-gold/30 transition-all"
            onClick={() => createNote({ templateId: tpl.id, title: tpl.name })}
          >
            <div className="font-bold text-sm">{tpl.name}</div>
            <p className="text-xs text-text3 mt-1">{tpl.description}</p>
          </GlassCard>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="🔍 بحث في المعرفة…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs border",
              category === "all" ? "border-gold bg-gold/15 text-gold2" : "border-border2 text-text3"
            )}
          >
            الكل
          </button>
          {JOURNAL_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs border",
                category === c.id ? "border-gold bg-gold/15 text-gold2" : "border-border2 text-text3"
              )}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {!entries.length ? (
        <EmptyState
          icon="🧠"
          title="ابدأ عقلك الثاني"
          description="مذكرات · أفكار · بحث · يوميات — كلها مرتبطة بـ LifeOS"
          suggestedActions={[
            { label: "مذكرة جديدة", onClick: () => createNote(), variant: "gold" },
            { label: "يومية اليوم", onClick: () => createNote({ isDaily: true }), variant: "ghost" },
            { label: "مراجعة يومية", onClick: () => createNote({ templateId: "tpl_daily_review" }), variant: "ghost" },
          ]}
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {entries.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link href={`/journal/${e.id}`}>
                <GlassCard className="p-5 h-full hover:border-gold/30 hover:shadow-premium-lg transition-all group overflow-hidden">
                  {e.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.coverUrl}
                      alt=""
                      className="w-full h-28 object-cover rounded-lg mb-3 -mt-1"
                    />
                  )}
                  <div className="text-[10px] text-text3 font-mono">
                    {e.isDaily && e.journalDate ? `📔 ${e.journalDate}` : JOURNAL_CATEGORIES.find((c) => c.id === e.category)?.icon}
                    {" · "}{e.readingTimeMin} د · {e.wordCount} كلمة
                  </div>
                  <h3 className="font-bold text-base mt-1 group-hover:text-gold2 transition-colors line-clamp-2">
                    {e.title}
                  </h3>
                  {e.subtitle && (
                    <p className="text-xs text-text3 mt-1 line-clamp-2">{e.subtitle}</p>
                  )}
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
