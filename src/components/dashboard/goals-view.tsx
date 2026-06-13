"use client";
import { ViewShell } from "@/components/motion/view-shell";
import { CardUnfold } from "@/components/motion/unfold-reveal";

import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tabs } from "@/components/ui/tabs";
import { GoalsKanban } from "@/components/dashboard/goals-kanban";
import { PremiumGoalCard } from "@/components/goals/premium-goal-card";
import { AppModal } from "@/components/ui/app-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/contexts/toast-context";
import { useGoalExpand } from "@/contexts/goal-expand-context";
import { areaLabel, calcGoalPct } from "@/lib/calculations";
import { calcGoalProbability } from "@/lib/dashboard/goal-probability";
import { resolveDomainId } from "@/lib/domains";
import type { Goal, GoalArea, GoalLevel, GoalStatus, GoalTask, ProGoal, YearPayload } from "@/types/lifeos";

const AREAS: GoalArea[] = ["body", "finance", "career", "mind", "spirit", "relation", "self"];
const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "health", label: "💪 صحة" },
  { id: "career", label: "📈 مهنة" },
  { id: "finance", label: "💰 مال" },
  { id: "learning", label: "🧠 تعلم" },
  { id: "self_dev", label: "⚡ تطوير" },
];

const STATUS_FILTERS: { id: GoalStatus | "all"; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "active", label: "نشط" },
  { id: "done", label: "مكتمل" },
  { id: "paused", label: "متوقف" },
  { id: "cancelled", label: "ملغي" },
];

interface GoalsViewProps {
  yearData: YearPayload;
  onRefresh: () => void;
  openAdd?: boolean;
  onAddClose?: () => void;
}

export function GoalsView({ yearData, onRefresh, openAdd, onAddClose }: GoalsViewProps) {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<"kanban" | "grid" | "hierarchy" | "analytics" | "timeline">("kanban");
  const [statusFilter, setStatusFilter] = useState<GoalStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [quickTitle, setQuickTitle] = useState("");
  const showModal = modalOpen || !!openAdd;

  const [form, setForm] = useState({
    title: "",
    area: "career" as GoalArea,
    priority: "high" as "high" | "med" | "low",
    level: "goal" as GoalLevel,
    description: "",
    why: "",
    due: "",
    progress: 0,
    parentId: "",
  });

  const goals = yearData.goals ?? [];

  const filtered = useMemo(() => {
    return goals.filter((g) => {
      const st = g.status ?? (g.done ? "done" : "active");
      if (statusFilter !== "all" && st !== statusFilter) return false;
      if (categoryFilter !== "all") {
        const cat = g.category ?? g.area;
        if (cat !== categoryFilter && g.area !== categoryFilter) return false;
      }
      return true;
    });
  }, [goals, statusFilter, categoryFilter]);

  const proGoals: ProGoal[] = filtered.map((g) => ({
    ...g,
    status: (g.status ?? (g.done ? "done" : "active")) as GoalStatus,
    progress: g.progress ?? calcGoalPct(g),
  }));

  const stats = {
    all: goals.length,
    active: goals.filter((g) => (g.status ?? "active") === "active" && !g.done).length,
    done: goals.filter((g) => g.done || g.status === "done").length,
    avg: goals.length
      ? Math.round(goals.reduce((a, g) => a + (g.progress ?? calcGoalPct(g)), 0) / goals.length)
      : 0,
  };
  const atRiskCount = goals.filter((g) => {
    const prob = calcGoalProbability({
      progress: g.progress ?? calcGoalPct(g),
      target_date: g.targetDate ?? g.due,
      created_at: g.createdAt,
      status: g.status,
    });
    return Boolean(prob && prob.label === "needs_attention");
  }).length;
  const byCategory = goals.reduce<Record<string, { count: number; progress: number }>>((acc, g) => {
    const key = g.category ?? g.area ?? "other";
    if (!acc[key]) acc[key] = { count: 0, progress: 0 };
    acc[key].count += 1;
    acc[key].progress += g.progress ?? calcGoalPct(g);
    return acc;
  }, {});

  async function saveGoal() {
    const tasks: GoalTask[] = [];
    const category = form.area === "body" ? "health" : form.area === "mind" ? "learning" : form.area;
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        parentId: form.parentId || undefined,
        area: form.area,
        category,
        domainId: resolveDomainId(category),
        level: form.level,
        tasks,
        progress: form.progress,
        status: "active",
      }),
    });
    setModalOpen(false);
    onAddClose?.();
    setForm({ title: "", area: "career", priority: "high", level: "goal", description: "", why: "", due: "", progress: 0, parentId: "" });
    onRefresh();
    toast("تم حفظ الهدف", "success");
  }

  async function quickAddGoal() {
    if (!quickTitle.trim()) return;
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: quickTitle.trim(),
        area: "career",
        category: "career",
        domainId: resolveDomainId("career"),
        level: "goal",
        tasks: [],
        progress: 0,
        status: "active",
        priority: "med",
      }),
    });
    setQuickTitle("");
    onRefresh();
  }

  async function deleteGoal(id: string) {
    if (!confirm("حذف هذا الهدف؟")) return;
    await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    onRefresh();
  }

  async function updateStatus(id: string, status: GoalStatus) {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, done: status === "done", progress: status === "done" ? 100 : undefined }),
    });
    onRefresh();
  }

  const hierarchy = buildHierarchy(goals);

  return (
    <ViewShell>
      <ViewShell.Cards>
        <KpiCard label="📋 إجمالي" value={String(stats.all)} sub="" color="var(--gold)" />
        <KpiCard label="🟢 نشط" value={String(stats.active)} sub="" color="var(--teal)" />
        <KpiCard label="✅ مكتمل" value={String(stats.done)} sub="" color="var(--emerald)" />
        <KpiCard label="📈 متوسط التقدم" value={`${stats.avg}%`} sub="" color="var(--sky)" />
      </ViewShell.Cards>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <Tabs
            tabs={[
              { id: "kanban", label: "Kanban" },
              { id: "grid", label: "بطاقات" },
              { id: "hierarchy", label: "التسلسل" },
              { id: "analytics", label: "التحليلات" },
              { id: "timeline", label: "الخط الزمني" },
            ]}
            active={view}
            onChange={(id) => setView(id as typeof view)}
          />
          <Button variant="gold" size="sm" onClick={() => setModalOpen(true)}>
            + هدف جديد
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                statusFilter === f.id
                  ? "bg-gold/15 border-gold/40 text-gold2"
                  : "border-border text-text3 hover:border-border2"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                categoryFilter === c.id
                  ? "bg-sky/15 border-sky/40 text-sky"
                  : "border-border text-text3"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="➕ إضافة هدف سريع..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") quickAddGoal();
            }}
          />
          <Button variant="gold" size="sm" onClick={quickAddGoal}>
            إضافة
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {GOAL_TEMPLATES.map((tpl) => (
            <Button
              key={tpl.title}
              variant="ghost"
              size="sm"
              onClick={async () => {
                await fetch("/api/goals", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...tpl,
                    domainId: resolveDomainId(tpl.area === "mind" ? "learning" : tpl.area),
                    tasks: [],
                    status: "active",
                  }),
                });
                onRefresh();
              }}
            >
              + {tpl.title}
            </Button>
          ))}
        </div>
      </Card>

      {view === "kanban" && (
        goals.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="لا توجد أهداف بعد"
            description="حوّل أحلامك إلى أهداف قابلة للقياس مع مهام وعادات مرتبطة"
            example="زيادة الوزن 5 كجم · قراءة 12 كتاباً · ترقية وظيفية"
            suggestedActions={[
              { label: "أنشئ هدفك الأول", onClick: () => setModalOpen(true), variant: "gold" },
              { label: "أهداف تجريبية", href: "/welcome", variant: "ghost" },
              { label: "دليل الأهداف", href: "/guide", variant: "ghost" },
            ]}
          />
        ) : (
        <GoalsKanban
          goals={proGoals}
          onStatusChange={updateStatus}
        />
        )
      )}

      {view === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((g) => (
            <PremiumGoalCard
              key={g.id}
              goal={g}
              onDelete={() => deleteGoal(g.id)}
              onBumpProgress={async () => {
                const pct = g.progress ?? calcGoalPct(g);
                await fetch("/api/goals", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: g.id, progress: Math.min(100, pct + 5), current: String(Math.min(100, pct + 5)) }),
                });
                onRefresh();
              }}
            />
          ))}
          {!filtered.length && (
            <p className="text-text3 col-span-2 text-center py-8">لا أهداف مطابقة للفلتر</p>
          )}
        </div>
      )}

      {view === "hierarchy" && (
        <div className="space-y-4">
          {hierarchy.length === 0 ? (
            <EmptyState
              icon="🏛️"
              title="لا توجد هيكلة بعد"
              description="ابدأ برؤية (Vision) ثم أهداف ومشاريع مرتبطة بها"
              suggestedActions={[
                { label: "أضف رؤية", onClick: () => { setForm((f) => ({ ...f, level: "vision" })); setModalOpen(true); }, variant: "gold" },
                { label: "مركز الترحيب", href: "/welcome", variant: "ghost" },
              ]}
            />
          ) : (
            hierarchy.map((node, i) => (
              <HierarchyNode key={node.goal.id} node={node} depth={0} unfoldIndex={i} />
            ))
          )}
        </div>
      )}
      {view === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-xs text-text3 mb-1">متوسط التقدم</div>
            <div className="text-2xl font-bold text-gold2">{stats.avg}%</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-text3 mb-1">أهداف معرضة للخطر</div>
            <div className="text-2xl font-bold text-rose2">{atRiskCount}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-text3 mb-1">الفئات</div>
            <div className="text-sm text-text2">{Object.keys(byCategory).length}</div>
          </Card>
          <Card className="p-4 md:col-span-3 space-y-2">
            <h4 className="text-sm font-semibold">التقدم حسب الفئة</h4>
            {Object.entries(byCategory).map(([cat, s]) => {
              const avg = Math.round(s.progress / Math.max(1, s.count));
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{cat}</span>
                    <span className="font-mono">{avg}%</span>
                  </div>
                  <ProgressBar value={avg} color="var(--sky)" />
                </div>
              );
            })}
          </Card>
        </div>
      )}
      {view === "timeline" && (
        <Card className="p-4 space-y-3">
          {(filtered.filter((g) => g.targetDate || g.due)).sort((a, b) =>
            String(a.targetDate ?? a.due).localeCompare(String(b.targetDate ?? b.due))
          ).map((g) => (
            <TimelineGoalRow key={g.id} goal={g} />
          ))}
          {!filtered.some((g) => g.targetDate || g.due) && (
            <p className="text-text3 text-center py-6">لا توجد أهداف بتاريخ هدف</p>
          )}
        </Card>
      )}

      <GoalFormModal open={showModal} form={form} setForm={setForm} onClose={() => { setModalOpen(false); onAddClose?.(); }} onSave={saveGoal} goals={goals} />
    </ViewShell>
  );
}

const GOAL_TEMPLATES: Array<{
  title: string;
  area: GoalArea;
  category: string;
  due: string;
  description: string;
  why: string;
  priority: "high" | "med" | "low";
  level: GoalLevel;
}> = [
  {
    title: "زيادة الوزن إلى 75 كجم",
    area: "body",
    category: "health",
    due: "",
    description: "خطة غذائية وتمارين مقاومة للوصول لوزن صحي",
    why: "تحسين القوة والشكل والصحة",
    priority: "high",
    level: "goal",
  },
  {
    title: "التحول إلى Financial Analyst",
    area: "career",
    category: "career",
    due: "",
    description: "اكتساب المهارات وبناء بورتفوليو والتقديم على وظائف",
    why: "تطوير المسار المهني وزيادة الدخل",
    priority: "high",
    level: "goal",
  },
  {
    title: "صندوق الطوارئ 6 أشهر",
    area: "finance",
    category: "finance",
    due: "",
    description: "ادخار شهري منتظم حتى تغطية 6 أشهر مصروفات",
    why: "أمان مالي وتقليل القلق",
    priority: "high",
    level: "goal",
  },
  {
    title: "قراءة 12 كتاب في السنة",
    area: "mind",
    category: "learning",
    due: "",
    description: "كتاب كل شهر مع ملاحظات تطبيقية",
    why: "رفع المعرفة وتحسين التفكير",
    priority: "med",
    level: "goal",
  },
];

function buildHierarchy(goals: Goal[]) {
  const byId = new Map(goals.map((g) => [g.id, g]));
  const roots = goals.filter((g) => !g.parentId || !byId.has(g.parentId));
  type Node = { goal: Goal; children: Node[] };
  function childrenOf(parentId: string): Node[] {
    return goals
      .filter((g) => g.parentId === parentId)
      .map((g) => ({ goal: g, children: childrenOf(g.id) }));
  }
  return roots.map((g) => ({ goal: g, children: childrenOf(g.id) }));
}

function HierarchyNode({
  node,
  depth,
  unfoldIndex,
}: {
  node: { goal: Goal; children: { goal: Goal; children: unknown[] }[] };
  depth: number;
  unfoldIndex: number;
}) {
  const g = node.goal;
  const levelIcon = g.level === "vision" ? "🔭" : g.level === "project" ? "📁" : "🎯";
  return (
    <CardUnfold index={unfoldIndex} baseDelay={0.08}>
      <div style={{ marginRight: depth * 20 }}>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm">{levelIcon}</span>
          <div className="flex-1">
            <PremiumGoalCard goal={g} compact />
          </div>
        </div>
        {node.children.map((c, i) => (
          <HierarchyNode
            key={c.goal.id}
            node={c as typeof node}
            depth={depth + 1}
            unfoldIndex={unfoldIndex + i + 1}
          />
        ))}
      </div>
    </CardUnfold>
  );
}

function TimelineGoalRow({ goal }: { goal: Goal }) {
  const expand = useGoalExpand();
  const pct = goal.progress ?? calcGoalPct(goal);

  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 border-b border-border/40 pb-2 last:border-0 cursor-pointer hover:bg-surface2/50 rounded-sm px-1 -mx-1 transition-colors text-right"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        expand.expandGoal({ ...goal, progress: pct }, rect);
      }}
    >
      <div className="text-xs font-mono text-sky min-w-[95px]">{goal.targetDate ?? goal.due}</div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{goal.title}</div>
        <div className="text-[11px] text-text3">{areaLabel(goal.area)}</div>
      </div>
      <div className="text-xs font-mono text-text3">{pct}%</div>
    </button>
  );
}

function GoalFormModal({
  open,
  form,
  setForm,
  onClose,
  onSave,
  goals,
}: {
  open: boolean;
  form: { title: string; area: GoalArea; priority: "high" | "med" | "low"; level: GoalLevel; description: string; why: string; due: string; progress: number; parentId: string };
  setForm: Dispatch<SetStateAction<typeof form>>;
  onClose: () => void;
  onSave: () => void;
  goals: Goal[];
}) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="هدف جديد"
      icon="🎯"
      size="lg"
      onSave={onSave}
      saveDisabled={!form.title.trim()}
    >
      <div>
        <Label>العنوان</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>المستوى</Label>
          <select
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value as GoalLevel })}
          >
            <option value="vision">رؤية (Vision)</option>
            <option value="goal">هدف (Goal)</option>
            <option value="project">مشروع (Project)</option>
          </select>
        </div>
        <div>
          <Label>المنطقة</Label>
          <select
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value as GoalArea })}
          >
            {AREAS.map((a) => (
              <option key={a} value={a}>{areaLabel(a)}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label>الهدف الأب (اختياري)</Label>
        <select
          className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
          value={(form as { parentId?: string }).parentId ?? ""}
          onChange={(e) => setForm({ ...form, parentId: e.target.value } as typeof form)}
        >
          <option value="">بدون</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>لماذا؟</Label>
        <Input value={form.why} onChange={(e) => setForm({ ...form, why: e.target.value })} />
      </div>
      <div>
        <Label>الوصف</Label>
        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div>
        <Label>تاريخ الهدف</Label>
        <Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
      </div>
    </AppModal>
  );
}

