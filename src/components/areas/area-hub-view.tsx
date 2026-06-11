"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/ui/progress-bar";
import { VirtualList } from "@/components/ui/virtual-list";
import { AreaKnowledgeGraph } from "@/components/areas/area-knowledge-graph";
import { AreaOverviewCommand } from "@/components/areas/area-overview-command";
import { AreaIntelligencePanel } from "@/components/areas/area-intelligence-panel";
import { GoalDrillDownPanel } from "@/components/areas/goal-drill-down-panel";
import type { AreaHubPayload, GoalDrillDown } from "@/types/areas";

interface Props {
  slug: string;
}

const TABS = [
  { id: "overview", label: "🏠 نظرة" },
  { id: "goals", label: "🎯 أهداف" },
  { id: "tasks", label: "📋 مهام" },
  { id: "habits", label: "✅ عادات" },
  { id: "books", label: "📚 كتب" },
  { id: "learn", label: "🎓 تعلم" },
  { id: "graph", label: "🔗 علاقات" },
  { id: "coach", label: "🧠 مدرب" },
];

export function AreaHubView({ slug }: Props) {
  const [hub, setHub] = useState<AreaHubPayload | null>(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [drillDown, setDrillDown] = useState<GoalDrillDown | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/areas/${slug}`);
    const json = await res.json().catch(() => null);
    if (json?.area) setHub(json as AreaHubPayload);
    setLoading(false);
  }, [slug]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && TABS.some((t) => t.id === hash)) setTab(hash);
    const onHash = () => {
      const h = window.location.hash.slice(1);
      if (h && TABS.some((t) => t.id === h)) setTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

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

  async function openGoal(goalId: string) {
    const res = await fetch(`/api/areas/${slug}?goalId=${goalId}`);
    const json = await res.json().catch(() => null);
    if (json?.drillDown) setDrillDown(json.drillDown);
  }

  if (loading && !hub) return <div className="h-48 skeleton-shimmer rounded-[10px]" />;
  if (!hub) return <p className="text-text3">المجال غير موجود</p>;

  const a = hub.area;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center gap-3">
        <Link href="/areas" className="text-text3 hover:text-gold2 text-sm">← المناطق</Link>
        <span className="text-3xl">{a.icon}</span>
        <div>
          <h1 className="font-display text-2xl font-black">{a.nameAr}</h1>
          <p className="text-sm text-text3">Life Area Command Center</p>
        </div>
      </div>

      <Card className="p-5 border-gold/20" style={{ borderColor: `${a.color}40` }}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-sm text-text3">Area Health Score</div>
            <div className="text-3xl font-black" style={{ color: a.color }}>{hub.healthScore}%</div>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center text-[11px]">
            <CountLink label="أهداف" value={hub.counts.goals} tab="goals" onNav={setTab} />
            <CountLink label="عادات" value={hub.counts.habits} tab="habits" onNav={setTab} />
            <CountLink label="مهام" value={hub.counts.tasks} tab="tasks" onNav={setTab} />
            <CountLink label="كتب" value={hub.counts.books} tab="books" onNav={setTab} />
          </div>
        </div>
        <ProgressBar value={hub.healthScore} color={a.color} className="h-2" />
        <div className="flex flex-wrap gap-2 mt-2">
          {hub.scoreReasons.map((r) => (
            <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-surface2 text-text3">{r}</span>
          ))}
        </div>
      </Card>

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={(id) => {
          setTab(id);
          window.history.replaceState(null, "", `#${id}`);
        }}
      />

      {hub.metrics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hub.metrics.map((m) => (
            <span key={m.label} className="text-xs px-3 py-1.5 rounded-full bg-surface2 border border-border/50">
              <span className="text-text3">{m.label}:</span> <span className="font-mono font-bold">{m.value}</span>
            </span>
          ))}
        </div>
      )}

      {tab === "overview" && (
        <AreaOverviewCommand hub={hub} onNav={setTab} onOpenGoal={openGoal} />
      )}

      {tab === "goals" && (
        <Card className="p-4 space-y-3" id="goals">
          {!hub.goals.length && <p className="text-text3 text-sm">لا أهداف — <Link href="/goals" className="text-gold2">أضف هدفاً</Link></p>}
          {hub.goals.map((g) => (
            <button
              key={g.id}
              type="button"
              className="w-full text-right p-3 rounded-sm border border-border/50 hover:border-gold/30 bg-surface2/40"
              onClick={() => openGoal(g.id)}
            >
              <div className="flex justify-between text-sm font-medium">
                <span>{g.progress}%</span>
                <span>{g.title}</span>
              </div>
              <ProgressBar value={g.progress} color="var(--gold)" className="h-1 mt-2" />
              <div className="text-[10px] text-text3 mt-1">
                {g.completion?.probabilityText ?? g.status}
                {g.targetDate && ` · ${g.targetDate}`}
              </div>
            </button>
          ))}
        </Card>
      )}

      {tab === "tasks" && (
        <Card className="p-4" id="tasks">
          <div className="text-sm font-bold mb-3">مهام اليوم ({hub.tasksDueToday.length}) · متأخرة ({hub.tasksOverdue.length})</div>
          <VirtualList
            items={hub.tasks.filter((t) => t.status !== "done")}
            rowHeight={44}
            maxHeight={400}
            renderRow={(t) => (
              <div className="flex justify-between text-sm border-b border-border/40 py-2">
                <span className={t.dueDate && t.dueDate < new Date().toISOString().slice(0, 10) ? "text-red2" : ""}>{t.title}</span>
                <span className="text-text3 text-xs">{t.dueDate ?? "—"} · {t.priority}</span>
              </div>
            )}
          />
        </Card>
      )}

      {tab === "habits" && (
        <Card className="p-4 space-y-2" id="habits">
          {hub.habits.map((h) => (
            <div key={h.id} className="flex justify-between text-sm p-2 rounded-sm bg-surface2/50">
              <span>{h.doneToday ? "✅" : "○"} {h.name}</span>
              <span className="font-mono text-xs text-text3">{h.adherencePct}% · 🔥{h.streak}</span>
            </div>
          ))}
        </Card>
      )}

      {tab === "books" && (
        <div className="grid md:grid-cols-3 gap-4" id="books">
          <BookColumn title="📖 تقرأ حالياً" books={hub.books.current} />
          <BookColumn title="📚 القادم" books={hub.books.upcoming} />
          <BookColumn title="📘 مكتمل" books={hub.books.completed} />
        </div>
      )}

      {tab === "learn" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm font-bold mb-2">🎓 Courses</div>
            {hub.courses.current.map((c) => (
              <div key={c.id} className="text-sm py-1">{c.title} — {c.progress}%</div>
            ))}
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold mb-2">🏅 Certifications</div>
            {hub.certifications.current.map((c) => (
              <div key={c.id} className="text-sm py-1">{c.name} — {c.progressPct}%</div>
            ))}
            {hub.certifications.upcoming.map((c) => (
              <div key={c.id} className="text-sm py-1 text-text3">قادم: {c.name}</div>
            ))}
          </Card>
        </div>
      )}

      {tab === "graph" && (
        <Card className="p-4">
          <AreaKnowledgeGraph nodes={hub.graph.nodes} edges={hub.graph.edges} />
        </Card>
      )}

      {tab === "coach" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <AreaIntelligencePanel hub={hub} />
          <Card className="p-4 space-y-3">
            {hub.coach.map((c) => (
              <div key={c.id} className={`p-3 rounded-sm border text-sm ${c.priority === "high" ? "border-red2/40 bg-red2/5" : "border-border2 bg-surface2"}`}>
                {c.icon} {c.message}
                {c.action && <div className="text-xs text-gold2 mt-1">{c.action}</div>}
              </div>
            ))}
          </Card>
        </div>
      )}

      {drillDown && <GoalDrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />}
    </div>
  );
}

function CountLink({ label, value, tab, onNav }: { label: string; value: number; tab: string; onNav: (t: string) => void }) {
  return (
    <button type="button" onClick={() => onNav(tab)} className="hover:text-gold2">
      <div className="font-black text-lg">{value}</div>
      <div className="text-text3">{label}</div>
    </button>
  );
}

function BookColumn({ title, books }: { title: string; books: { id: string; title: string; progress: number }[] }) {
  return (
    <Card className="p-4">
      <div className="text-sm font-bold mb-2">{title}</div>
      {books.map((b) => (
        <div key={b.id} className="text-sm py-1">
          {b.title}
          {b.progress > 0 && <span className="text-gold2 text-xs mr-1">{b.progress}%</span>}
        </div>
      ))}
      {!books.length && <p className="text-text3 text-xs">—</p>}
    </Card>
  );
}
