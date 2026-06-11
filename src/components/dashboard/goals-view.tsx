"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tabs } from "@/components/ui/tabs";
import { GoalsKanban } from "@/components/dashboard/goals-kanban";
import { areaColor, areaLabel, calcGoalPct } from "@/lib/calculations";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
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
    setDetailGoal(null);
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

  async function linkTaskToGoal(goalId: string, taskId: string | null) {
    if (!taskId) return;
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, goalId }),
    });
    onRefresh();
  }

  async function unlinkTask(taskId: string) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, goalId: null }),
    });
    onRefresh();
  }

  async function linkHabitToGoal(goalId: string, habitId: string) {
    const habit = yearData.habits.find((h) => h.id === habitId);
    if (!habit) return;
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...habit,
        id: habitId,
        goalLink: goalId,
      }),
    });
    onRefresh();
  }

  async function unlinkHabit(habitId: string) {
    const habit = yearData.habits.find((h) => h.id === habitId);
    if (!habit) return;
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...habit,
        goalLink: "",
      }),
    });
    onRefresh();
  }

  const hierarchy = buildHierarchy(goals);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="📋 إجمالي" value={String(stats.all)} sub="" color="var(--gold)" />
        <KpiCard label="🟢 نشط" value={String(stats.active)} sub="" color="var(--teal)" />
        <KpiCard label="✅ مكتمل" value={String(stats.done)} sub="" color="var(--emerald)" />
        <KpiCard label="📈 متوسط التقدم" value={`${stats.avg}%`} sub="" color="var(--sky)" />
      </div>

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
        <GoalsKanban
          goals={proGoals}
          onStatusChange={updateStatus}
          onOpen={setDetailGoal}
        />
      )}

      {view === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onDelete={() => deleteGoal(g.id)}
              onUpdate={onRefresh}
              onOpen={() => setDetailGoal(g)}
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
            <p className="text-text3 text-center py-8">
              أضف رؤية (Vision) ثم أهداف ومشاريع مرتبطة بها
            </p>
          ) : (
            hierarchy.map((node) => <HierarchyNode key={node.goal.id} node={node} depth={0} onOpen={setDetailGoal} />)
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
            <div
              key={g.id}
              className="flex items-center gap-3 border-b border-border/40 pb-2 last:border-0 cursor-pointer"
              onClick={() => setDetailGoal(g)}
            >
              <div className="text-xs font-mono text-sky min-w-[95px]">{g.targetDate ?? g.due}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{g.title}</div>
                <div className="text-[11px] text-text3">{areaLabel(g.area)}</div>
              </div>
              <div className="text-xs font-mono text-text3">{g.progress ?? calcGoalPct(g)}%</div>
            </div>
          ))}
          {!filtered.some((g) => g.targetDate || g.due) && (
            <p className="text-text3 text-center py-6">لا توجد أهداف بتاريخ هدف</p>
          )}
        </Card>
      )}

      {showModal && <GoalFormModal form={form} setForm={setForm} onClose={() => { setModalOpen(false); onAddClose?.(); }} onSave={saveGoal} goals={goals} />}
      {detailGoal && (
        <GoalDetailModal
          goal={detailGoal}
          allTasks={yearData.tasks ?? []}
          allHabits={yearData.habits ?? []}
          onClose={() => setDetailGoal(null)}
          onDelete={() => deleteGoal(detailGoal.id)}
          onTaskLink={linkTaskToGoal}
          onTaskUnlink={unlinkTask}
          onHabitLink={linkHabitToGoal}
          onHabitUnlink={unlinkHabit}
        />
      )}
    </div>
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
  onOpen,
}: {
  node: { goal: Goal; children: { goal: Goal; children: unknown[] }[] };
  depth: number;
  onOpen: (g: Goal) => void;
}) {
  const g = node.goal;
  const pct = g.progress ?? 0;
  const levelIcon = g.level === "vision" ? "🔭" : g.level === "project" ? "📁" : "🎯";
  return (
    <div style={{ marginRight: depth * 20 }}>
      <Card
        className="p-3 mb-2 cursor-pointer hover:border-gold/30"
        onClick={() => onOpen(g)}
      >
        <div className="flex items-center gap-2">
          <span>{levelIcon}</span>
          <span className="text-sm font-semibold flex-1">{g.title}</span>
          <span className="text-xs font-mono text-text3">{pct}%</span>
        </div>
        <ProgressBar value={pct} color={areaColor(g.area)} className="mt-2" />
      </Card>
      {node.children.map((c) => (
        <HierarchyNode key={c.goal.id} node={c as typeof node} depth={depth + 1} onOpen={onOpen} />
      ))}
    </div>
  );
}

function GoalCard({
  goal,
  onDelete,
  onUpdate,
  onOpen,
}: {
  goal: Goal;
  onDelete: () => void;
  onUpdate: () => void;
  onOpen: () => void;
}) {
  const pct = goal.progress ?? calcGoalPct(goal);
  const prob = calcGoalProbability({
    progress: pct,
    target_date: goal.targetDate ?? goal.due,
    created_at: goal.createdAt,
    status: goal.status,
  });
  const prColors = { high: "var(--rose)", med: "var(--amber2)", low: "var(--emerald)" };

  async function bumpProgress() {
    const next = Math.min(100, pct + 5);
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goal.id, progress: next, current: String(next) }),
    });
    onUpdate();
  }

  return (
    <Card className="p-4 cursor-pointer hover:border-gold/30" onClick={onOpen}>
      <div className="flex gap-3">
        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: prColors[goal.priority] }} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-1">{goal.title}</div>
          {prob && <div className="text-[10px] text-text3 mb-2">{prob.text}</div>}
          <ProgressBar value={pct} color={areaColor(goal.area)} className="mb-1" />
          <div className="text-[10px] text-text3 font-mono flex gap-2 items-center">
            <span>{pct}%</span>
            <button type="button" className="text-gold2 hover:underline" onClick={(e) => { e.stopPropagation(); bumpProgress(); }}>
              + تحديث
            </button>
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          🗑
        </Button>
      </div>
    </Card>
  );
}

function GoalFormModal({
  form,
  setForm,
  onClose,
  onSave,
  goals,
}: {
  form: { title: string; area: GoalArea; priority: "high" | "med" | "low"; level: GoalLevel; description: string; why: string; due: string; progress: number; parentId: string };
  setForm: Dispatch<SetStateAction<typeof form>>;
  onClose: () => void;
  onSave: () => void;
  goals: Goal[];
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-surface border border-border2 rounded-[10px] w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-gold2">🎯 هدف جديد</h3>
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
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button variant="gold" onClick={onSave}>حفظ</Button>
        </div>
      </div>
    </div>
  );
}

function GoalDetailModal({
  goal,
  allTasks,
  allHabits,
  onClose,
  onDelete,
  onTaskLink,
  onTaskUnlink,
  onHabitLink,
  onHabitUnlink,
}: {
  goal: Goal;
  allTasks: YearPayload["tasks"];
  allHabits: YearPayload["habits"];
  onClose: () => void;
  onDelete: () => void;
  onTaskLink: (goalId: string, taskId: string | null) => Promise<void>;
  onTaskUnlink: (taskId: string) => Promise<void>;
  onHabitLink: (goalId: string, habitId: string) => Promise<void>;
  onHabitUnlink: (habitId: string) => Promise<void>;
}) {
  const pct = goal.progress ?? calcGoalPct(goal);
  const prob = calcGoalProbability({ progress: pct, target_date: goal.targetDate ?? goal.due, created_at: goal.createdAt, status: goal.status });
  const linkedTasks = allTasks.filter((t) => t.goalId === goal.id);
  const linkedTaskIds = linkedTasks.map((t) => t.id);
  const linkedHabits = allHabits.filter((h) => h.goalLink === goal.id);
  const linkedHabitIds = linkedHabits.map((h) => h.id);
  const [taskLink, setTaskLink] = useState("");
  const [habitLink, setHabitLink] = useState("");
  useEffect(() => {
    setTaskLink("");
    setHabitLink("");
  }, [goal.id]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="bg-surface border border-border2 rounded-[10px] w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-gold2 text-lg">{goal.title}</h3>
          <a href={`/goals/${goal.id}`} className="text-xs text-gold2 hover:underline shrink-0">Command Center →</a>
        </div>
        {prob && <div className="text-sm text-text2">{prob.text}</div>}
        <ProgressBar value={pct} color={areaColor(goal.area)} />
        {goal.why && <div><div className="text-xs text-text3 mb-1">لماذا</div><p className="text-sm">{goal.why}</p></div>}
        {goal.description && <div><div className="text-xs text-text3 mb-1">الوصف</div><p className="text-sm">{goal.description}</p></div>}
        {goal.successCriteria && <div><div className="text-xs text-text3 mb-1">معايير النجاح</div><p className="text-sm">{goal.successCriteria}</p></div>}
        <Card className="p-3 space-y-3">
          <div className="text-xs text-text3">ربط المهام والعادات</div>
          <div>
            <Label>المهام المرتبطة</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {linkedTaskIds.map((id) => {
                const task = allTasks.find((t) => t.id === id);
                return (
                  <button
                    key={id}
                    className="text-[10px] px-2 py-1 rounded bg-surface2"
                    onClick={() => onTaskUnlink(id)}
                  >
                    {task?.title ?? id} ×
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <select
                className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
                value={taskLink}
                onChange={(e) => setTaskLink(e.target.value)}
              >
                <option value="">اختر مهمة...</option>
                {allTasks.filter((t) => !linkedTaskIds.includes(t.id)).map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={async () => {
                  if (!taskLink) return;
                  await onTaskLink(goal.id, taskLink);
                  setTaskLink("");
                }}
              >
                ربط
              </Button>
            </div>
          </div>
          <div>
            <Label>العادات المرتبطة</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {linkedHabitIds.map((id) => {
                const habit = allHabits.find((h) => h.id === id);
                return (
                  <button
                    key={id}
                    className="text-[10px] px-2 py-1 rounded bg-surface2"
                    onClick={() => onHabitUnlink(id)}
                  >
                    {habit?.name ?? id} ×
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <select
                className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
                value={habitLink}
                onChange={(e) => setHabitLink(e.target.value)}
              >
                <option value="">اختر عادة...</option>
                {allHabits.filter((h) => !linkedHabitIds.includes(h.id)).map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={async () => {
                  if (!habitLink) return;
                  await onHabitLink(goal.id, habitLink);
                  setHabitLink("");
                }}
              >
                ربط
              </Button>
            </div>
          </div>
        </Card>
        <div className="flex gap-2 justify-end">
          <Button variant="danger" size="sm" onClick={onDelete}>حذف</Button>
          <Button variant="ghost" onClick={onClose}>إغلاق</Button>
        </div>
      </div>
    </div>
  );
}
