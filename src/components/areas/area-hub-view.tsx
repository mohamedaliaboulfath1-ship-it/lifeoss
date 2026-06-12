"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageUnfold, SectionReveal } from "@/components/motion/unfold-reveal";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { VirtualList } from "@/components/ui/virtual-list";
import { ParticlesBackground } from "@/components/motion/particles-background";
import { AreaOverviewCommand } from "@/components/areas/area-overview-command";
import { AreaIntelligencePanel } from "@/components/areas/area-intelligence-panel";
import { GoalDrillDownPanel } from "@/components/areas/goal-drill-down-panel";
import { getAreaGradient } from "@/lib/areas/gradients";
import { buildAreaParaGraph } from "@/lib/areas/para-graph";
import type { AreaHubPayload, GoalDrillDown } from "@/types/areas";
import { cn } from "@/lib/utils";

const AreaParaFlow = dynamic(
  () => import("@/components/areas/area-para-flow").then((m) => m.AreaParaFlow),
  { ssr: false, loading: () => <div className="h-[360px] skeleton-shimmer rounded-xl" /> }
);

const TABS = [
  { id: "overview", label: "نظرة", icon: "🏠" },
  { id: "goals", label: "أهداف", icon: "🎯" },
  { id: "tasks", label: "مهام", icon: "📋" },
  { id: "habits", label: "عادات", icon: "✅" },
  { id: "books", label: "كتب", icon: "📚" },
  { id: "learn", label: "تعلم", icon: "🎓" },
  { id: "graph", label: "PARA", icon: "🔗" },
  { id: "coach", label: "مدرب", icon: "🧠" },
] as const;

interface Props {
  slug: string;
}

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

  const paraGraph = useMemo(
    () =>
      hub
        ? buildAreaParaGraph(hub.area.nameAr, hub.area.icon, hub.area.color, hub.graph)
        : { nodes: [], edges: [] },
    [hub]
  );

  if (loading && !hub) {
    return (
      <div className="space-y-4 pb-10">
        <div className="h-40 skeleton-shimmer rounded-2xl" />
        <div className="h-12 skeleton-shimmer rounded-xl" />
        <div className="h-64 skeleton-shimmer rounded-xl" />
      </div>
    );
  }
  if (!hub) return <p className="text-text3">المجال غير موجود</p>;

  const a = hub.area;
  const gradient = getAreaGradient(slug);

  function setTabNav(id: string) {
    setTab(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <PageUnfold className="space-y-6 pb-12 max-w-[1400px] mx-auto">
      {/* Command Center Hero */}
      <SectionReveal index={0}>
        <div
          className="relative overflow-hidden rounded-2xl border border-border/40"
          style={{ boxShadow: `0 12px 40px ${gradient.glow}` }}
        >
          <div
            className="absolute inset-0 opacity-90"
            style={{ background: gradient.css }}
          />
          <ParticlesBackground count={18} color={gradient.from} />
          <div className="relative z-[2] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/areas"
                  className="text-xs text-white/70 hover:text-white transition-colors shrink-0"
                >
                  ← المناطق
                </Link>
                <span className="text-4xl">{a.icon}</span>
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-black text-white">
                    {a.nameAr} Command Center
                  </h1>
                  <p className="text-sm text-white/70 mt-0.5">مركز قيادة المجال</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ProgressRing
                  value={hub.healthScore}
                  size={72}
                  strokeWidth={5}
                  color="#fff"
                  showValue
                  suffix="%"
                />
                <div className="text-white">
                  <div className="text-[10px] uppercase tracking-widest opacity-70">Health</div>
                  <div className="text-2xl font-black">
                    <AnimatedCounter value={hub.healthScore} suffix="%" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <HeroStat label="أهداف" value={hub.counts.goals} onClick={() => setTabNav("goals")} />
              <HeroStat label="مشاريع" value={hub.counts.projects} onClick={() => setTabNav("goals")} />
              <HeroStat label="عادات" value={hub.counts.habits} onClick={() => setTabNav("habits")} />
              <HeroStat label="مهام" value={hub.counts.tasks} onClick={() => setTabNav("tasks")} />
            </div>

            {hub.metrics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {hub.metrics.map((m) => (
                  <span
                    key={m.label}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/15 text-white backdrop-blur-sm border border-white/20"
                  >
                    {m.label}: <span className="font-mono font-bold">{m.value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionReveal>

      {/* Tab Navigation */}
      <SectionReveal index={1}>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTabNav(t.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                tab === t.id
                  ? "bg-gold/15 text-gold2 border border-gold/30 shadow-sm"
                  : "bg-surface2/60 text-text3 border border-border/40 hover:border-gold/20 hover:text-text2"
              )}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </SectionReveal>

      {/* Tab Content */}
      <SectionReveal index={2}>
        {tab === "overview" && (
          <AreaOverviewCommand hub={hub} onNav={setTabNav} onOpenGoal={openGoal} />
        )}

        {tab === "goals" && (
          <Card className="p-5 glass-premium space-y-3" id="goals">
            {!hub.goals.length && (
              <p className="text-text3 text-sm">
                لا أهداف — <Link href="/goals" className="text-gold2">أضف هدفاً</Link>
              </p>
            )}
            {hub.goals.map((g, i) => (
              <motion.button
                key={g.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-full text-right p-4 rounded-xl border border-border/50 hover:border-gold/30 bg-surface2/40 transition-colors"
                onClick={() => openGoal(g.id)}
              >
                <div className="flex justify-between text-sm font-medium">
                  <span className="font-mono text-gold2">{g.progress}%</span>
                  <span>{g.title}</span>
                </div>
                <ProgressBar value={g.progress} color={a.color} className="h-1.5 mt-2" />
                <div className="text-[10px] text-text3 mt-1">
                  {g.completion?.probabilityText ?? g.status}
                  {g.targetDate && ` · ${g.targetDate}`}
                </div>
              </motion.button>
            ))}
          </Card>
        )}

        {tab === "tasks" && (
          <Card className="p-5 glass-premium" id="tasks">
            <div className="text-sm font-bold mb-3">
              مهام اليوم ({hub.tasksDueToday.length}) · متأخرة ({hub.tasksOverdue.length})
            </div>
            <VirtualList
              items={hub.tasks.filter((t) => t.status !== "done")}
              rowHeight={48}
              maxHeight={480}
              renderRow={(t) => (
                <div className="flex justify-between text-sm border-b border-border/40 py-2.5 px-1">
                  <span className={t.dueDate && t.dueDate < new Date().toISOString().slice(0, 10) ? "text-red2" : ""}>
                    {t.title}
                  </span>
                  <span className="text-text3 text-xs">{t.dueDate ?? "—"} · {t.priority}</span>
                </div>
              )}
            />
          </Card>
        )}

        {tab === "habits" && (
          <Card className="p-5 glass-premium space-y-2" id="habits">
            {hub.habits.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex justify-between text-sm p-3 rounded-xl bg-surface2/50 border border-border/30"
              >
                <span>{h.doneToday ? "✅" : "○"} {h.name}</span>
                <span className="font-mono text-xs text-text3">{h.adherencePct}% · 🔥{h.streak}</span>
              </motion.div>
            ))}
            {!hub.habits.length && <p className="text-text3 text-sm">لا عادات مرتبطة</p>}
          </Card>
        )}

        {tab === "books" && (
          <div className="grid md:grid-cols-3 gap-4" id="books">
            <BookColumn title="📖 تقرأ حالياً" books={hub.books.current} color={a.color} />
            <BookColumn title="📚 القادم" books={hub.books.upcoming} color={a.color} />
            <BookColumn title="📘 مكتمل" books={hub.books.completed} color={a.color} />
          </div>
        )}

        {tab === "learn" && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5 glass-premium">
              <div className="text-sm font-bold mb-3">🎓 Courses</div>
              {hub.courses.current.map((c) => (
                <div key={c.id} className="text-sm py-2 border-b border-border/30 last:border-0">
                  {c.title} — <span className="text-gold2 font-mono">{c.progress}%</span>
                </div>
              ))}
              {!hub.courses.current.length && <p className="text-text3 text-xs">—</p>}
            </Card>
            <Card className="p-5 glass-premium">
              <div className="text-sm font-bold mb-3">🏅 Certifications</div>
              {hub.certifications.current.map((c) => (
                <div key={c.id} className="text-sm py-2">{c.name} — {c.progressPct}%</div>
              ))}
              {hub.certifications.upcoming.map((c) => (
                <div key={c.id} className="text-sm py-2 text-text3">قادم: {c.name}</div>
              ))}
              {!hub.certifications.current.length && !hub.certifications.upcoming.length && (
                <p className="text-text3 text-xs">—</p>
              )}
            </Card>
          </div>
        )}

        {tab === "graph" && (
          <div className="space-y-3">
            <p className="text-xs text-text3">
              خريطة PARA المتصلة — Area → Goals → Projects → Tasks → Habits → Resources
            </p>
            <AreaParaFlow nodes={paraGraph.nodes} edges={paraGraph.edges} height={400} />
          </div>
        )}

        {tab === "coach" && (
          <div className="grid lg:grid-cols-2 gap-4">
            <AreaIntelligencePanel hub={hub} />
            <Card className="p-5 glass-premium space-y-3">
              {hub.coach.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    "p-4 rounded-xl border text-sm",
                    c.priority === "high"
                      ? "border-red2/40 bg-red2/5"
                      : "border-border2 bg-surface2"
                  )}
                >
                  {c.icon} {c.message}
                  {c.action && <div className="text-xs text-gold2 mt-1">{c.action}</div>}
                </motion.div>
              ))}
              {!hub.coach.length && <p className="text-text3 text-sm">لا توصيات حالياً</p>}
            </Card>
          </div>
        )}
      </SectionReveal>

      {drillDown && <GoalDrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />}
    </PageUnfold>
  );
}

function HeroStat({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 text-center hover:bg-white/25 transition-colors"
    >
      <div className="text-xl font-black text-white font-mono">
        <AnimatedCounter value={value} />
      </div>
      <div className="text-[10px] text-white/70 mt-0.5">{label}</div>
    </button>
  );
}

function BookColumn({
  title,
  books,
  color,
}: {
  title: string;
  books: { id: string; title: string; progress: number }[];
  color: string;
}) {
  return (
    <Card className="p-5 glass-premium">
      <div className="text-sm font-bold mb-3">{title}</div>
      {books.map((b) => (
        <div key={b.id} className="text-sm py-2 border-b border-border/30 last:border-0">
          {b.title}
          {b.progress > 0 && (
            <span className="text-xs font-mono mr-1" style={{ color }}>{b.progress}%</span>
          )}
        </div>
      ))}
      {!books.length && <p className="text-text3 text-xs">—</p>}
    </Card>
  );
}
