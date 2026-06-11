"use client";
import { ViewShell } from "@/components/motion/view-shell";

import { useEffect, useMemo, useState } from "react";
import { useLifeOS } from "@/contexts/lifeos-context";
import { useToast } from "@/contexts/toast-context";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatePresence } from "framer-motion";
import { TaskRow } from "@/components/motion/task-row";
import { MotionModal } from "@/components/motion/motion";
import { LayoutAnimateList } from "@/components/motion/layout-animate-list";
import { useAchievementOptional } from "@/contexts/achievement-context";
import { today, uid } from "@/lib/utils";
import type { LifeTask, YearPayload } from "@/types/lifeos";

interface TasksViewProps {
  yearData: YearPayload;
  onRefresh?: () => void;
}

const FILTERS = [
  { id: "inbox", label: "📥 الوارد" },
  { id: "today", label: "🎯 اليوم" },
  { id: "upcoming", label: "📅 القادمة" },
  { id: "overdue", label: "⏰ المتأخرة" },
  { id: "completed", label: "✅ المكتملة" },
];

const VIEW_TABS = [
  { id: "list", label: "قائمة" },
  { id: "kanban", label: "Kanban" },
  { id: "calendar", label: "تقويم" },
  { id: "analytics", label: "تحليلات" },
];

export function TasksView({ yearData, onRefresh }: TasksViewProps) {
  const { patchYearData, refreshSilent } = useLifeOS();
  const { toast } = useToast();
  const celebrate = useAchievementOptional()?.celebrate;
  const [filter, setFilter] = useState("today");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState("list");
  const [focusMode, setFocusMode] = useState(false);
  const [modal, setModal] = useState(false);
  const [tasks, setTasks] = useState<LifeTask[]>(yearData.tasks ?? []);
  const [form, setForm] = useState({
    title: "",
    status: "inbox" as LifeTask["status"],
    priority: "p2" as "p1" | "p2" | "p3" | "p4",
    dueDate: today(),
    estimatedTime: 30,
    goalId: "",
    note: "",
  });

  useEffect(() => {
    setTasks(yearData.tasks ?? []);
  }, [yearData.tasks]);

  function applyTasks(next: LifeTask[]) {
    setTasks(next);
    patchYearData((y) => ({ ...y, tasks: next }));
  }

  async function refreshTasks() {
    const res = await fetch("/api/tasks");
    if (!res.ok) return;
    const json = await res.json();
    applyTasks((json.tasks as LifeTask[]) ?? []);
  }

  const filtered = useMemo(() => {
    const t = today();
    let list = [...tasks];
    if (filter === "inbox") list = list.filter((x) => x.status === "inbox");
    else if (filter === "today") {
      list = list.filter((x) => x.status !== "done" && x.status !== "archive" && x.dueDate === t);
    } else if (filter === "upcoming") {
      const end = new Date();
      end.setDate(end.getDate() + 7);
      const endStr = end.toISOString().slice(0, 10);
      list = list.filter(
        (x) =>
          x.status !== "done" &&
          x.status !== "archive" &&
          x.dueDate &&
          x.dueDate >= t &&
          x.dueDate <= endStr
      );
    } else if (filter === "overdue")
      list = list.filter(
        (x) => x.dueDate && x.dueDate < t && x.status !== "done" && x.status !== "archive"
      );
    else if (filter === "completed") list = list.filter((x) => x.status === "done").slice(-50);
    if (focusMode) {
      list = list.sort((a, b) => {
        if ((a.priority === "p1") === (b.priority === "p1")) return 0;
        return a.priority === "p1" ? -1 : 1;
      });
    }
    return list;
  }, [tasks, filter, focusMode]);

  const stats = useMemo(() => {
    const t = today();
    const active = tasks.filter((x) => x.status !== "done" && x.status !== "archive");
    const p1Open = active.filter((x) => x.priority === "p1").length;
    const done = tasks.filter((x) => x.status === "done");
    const doneRate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
    const avgEstimate = active.length
      ? Math.round(active.reduce((a, x) => a + (x.estimatedTime ?? 0), 0) / active.length)
      : 0;
    return {
      today: tasks.filter(
        (x) => x.dueDate === t && x.status !== "done" && x.status !== "archive"
      ).length,
      overdue: tasks.filter(
        (x) => x.dueDate && x.dueDate < t && x.status !== "done" && x.status !== "archive"
      ).length,
      inbox: tasks.filter((x) => x.status === "inbox").length,
      doneToday: tasks.filter((x) => x.completedDate === t).length,
      p1Open,
      doneRate,
      avgEstimate,
    };
  }, [tasks]);

  async function addTask() {
    if (!form.title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: uid(),
        title: form.title.trim(),
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        estimatedTime: form.estimatedTime || undefined,
        goalId: form.goalId || undefined,
        note: form.note || undefined,
      }),
    });
    setForm({
      title: "",
      status: "inbox",
      priority: "p2",
      dueDate: today(),
      estimatedTime: 30,
      goalId: "",
      note: "",
    });
    setModal(false);
    await refreshTasks();
    void refreshSilent();
  }

  async function toggleDone(id: string) {
    const found = tasks.find((x) => x.id === id);
    if (!found) return;
    const nextStatus = found.status === "done" ? "active" : "done";
    const nextCompleted = nextStatus === "done" ? today() : undefined;
    const snapshot = tasks;

    applyTasks(
      tasks.map((t) =>
        t.id === id
          ? { ...t, status: nextStatus, completedDate: nextCompleted }
          : t
      )
    );
    setPendingIds((s) => new Set(s).add(id));

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (!res.ok) throw new Error("failed");
      void refreshSilent();
    } catch {
      applyTasks(snapshot);
      toast("تعذّر تحديث المهمة", "error");
    } finally {
      setPendingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  }

  async function updateTaskStatus(id: string, status: LifeTask["status"]) {
    const found = tasks.find((x) => x.id === id);
    if (!found || found.status === status) return;
    const snapshot = tasks;
    applyTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
    setPendingIds((s) => new Set(s).add(id));
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("failed");
      void refreshSilent();
    } catch {
      applyTasks(snapshot);
      toast("تعذّر تحديث المهمة", "error");
    } finally {
      setPendingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  }

  async function removeTask(id: string) {
    const snapshot = tasks;
    applyTasks(tasks.filter((t) => t.id !== id));
    const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      applyTasks(snapshot);
      toast("فشل الحذف", "error");
      return;
    }
    void refreshSilent();
  }

  return (
    <ViewShell>
      <PageHeader
        title="✅ المهام"
        subtitle="3 مهام كبيرة فقط في اليوم — الإنجاز خير من القائمة الطويلة"
        actionLabel="+ مهمة جديدة"
        onAction={() => setModal(true)}
      />

      <ViewShell.Cards>
        <KpiCard label="اليوم" value={String(stats.today)} numericValue={stats.today} sub="" color="var(--gold)" />
        <KpiCard label="متأخرة" value={String(stats.overdue)} numericValue={stats.overdue} sub="" color="var(--rose)" />
        <KpiCard label="صندوق الوارد" value={String(stats.inbox)} numericValue={stats.inbox} sub="" color="var(--purple)" />
        <KpiCard label="منجزة اليوم" value={String(stats.doneToday)} numericValue={stats.doneToday} sub="" color="var(--emerald)" />
      </ViewShell.Cards>
      <ViewShell.Cards columns="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard label="P1 مفتوحة" value={String(stats.p1Open)} sub="" color="var(--coral)" />
        <KpiCard label="نسبة الإنجاز" value={`${stats.doneRate}%`} numericValue={stats.doneRate} suffix="%" sub="" color="var(--teal)" />
        <KpiCard label="متوسط الوقت" value={`${stats.avgEstimate} د`} sub="" color="var(--sky)" />
      </ViewShell.Cards>

      <Tabs tabs={FILTERS} active={filter} onChange={setFilter} />
      <div className="flex items-center justify-between">
        <Tabs tabs={VIEW_TABS} active={view} onChange={setView} className="mb-0 border-b-0 pb-0" />
        <button
          type="button"
          onClick={() => setFocusMode((x) => !x)}
          className={`text-xs px-3 py-1 rounded-full border ${focusMode ? "border-gold/40 text-gold2 bg-gold/10" : "border-border text-text3"}`}
        >
          🎯 Focus P1
        </button>
      </div>

      {view === "list" && (
        <Card className="p-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon="📋"
              title="لا توجد مهام هنا"
              actionLabel="+ مهمة جديدة"
              onAction={() => setModal(true)}
            />
          ) : (
            <ul className="space-y-0">
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    pending={pendingIds.has(task.id)}
                    dimmed={focusMode && task.priority !== "p1"}
                    onToggle={() => toggleDone(task.id)}
                    onCelebrate={() =>
                      celebrate?.({
                        kind: "task",
                        title: "مهمة منجزة!",
                        subtitle: task.title,
                      })
                    }
                    onRemove={() => removeTask(task.id)}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Card>
      )}

      {view === "kanban" && (
        <div className="grid md:grid-cols-4 gap-4">
          {(["inbox", "active", "done", "archive"] as const).map((status) => {
            const col = filtered.filter((t) => t.status === status);
            return (
              <Card key={status} className="p-3 space-y-2 min-h-[180px]">
                <div className="text-xs font-bold text-text2">
                  {status === "inbox" ? "الوارد" : status === "active" ? "نشطة" : status === "done" ? "مكتملة" : "أرشيف"} ({col.length})
                </div>
                {col.map((task) => (
                  <button
                    key={task.id}
                    className={`w-full text-right p-2 rounded bg-surface2 border border-border text-sm ${focusMode && task.priority !== "p1" ? "opacity-45" : ""}`}
                    onClick={() => {
                      const next =
                        status === "inbox"
                          ? "active"
                          : status === "active"
                            ? "done"
                            : status === "done"
                              ? "archive"
                              : "inbox";
                      void updateTaskStatus(task.id, next);
                    }}
                  >
                    <div className="font-semibold">{task.title}</div>
                    <div className="text-[10px] text-text3">{(task.priority ?? "p3").toUpperCase()}</div>
                  </button>
                ))}
                {!col.length && <p className="text-text3 text-xs text-center py-4">فارغ</p>}
              </Card>
            );
          })}
        </div>
      )}

      {view === "calendar" && (
        <Card className="p-4 space-y-2">
          <div className="text-sm font-semibold">Calendar Strip (14 يوم)</div>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {Array.from({ length: 14 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() + i);
              const ds = d.toISOString().slice(0, 10);
              const dayTasks = tasks.filter((t) => t.dueDate === ds && t.status !== "archive");
              return (
                <div key={ds} className="border border-border rounded p-2 bg-surface2 min-h-[80px]">
                  <div className="text-[10px] font-mono text-text3 mb-1">{ds.slice(5)}</div>
                  <div className="text-xs">{dayTasks.length} مهمة</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view === "analytics" && (
        <Card className="p-4 space-y-3">
          <div className="text-sm font-semibold">Task Analytics</div>
          <div className="grid md:grid-cols-4 gap-3 text-sm">
            {(["p1", "p2", "p3", "p4"] as const).map((p) => (
              <div key={p} className="border border-border rounded p-3 bg-surface2">
                <div className="text-xs text-text3 mb-1">{p.toUpperCase()}</div>
                <div className="font-bold">{tasks.filter((t) => (t.priority ?? "p3") === p).length}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-text3">
            نسبة المهام المكتملة: {stats.doneRate}% • المهام ذات هدف مرتبط: {tasks.filter((t) => t.goalId).length}
          </div>
        </Card>
      )}

      <MotionModal open={modal} onClose={() => setModal(false)}>
          <div className="bg-surface border border-border2 rounded-[10px] w-full p-6 space-y-4 shadow-premium-lg">
            <h3 className="font-bold text-gold2">مهمة جديدة</h3>
            <div>
              <Label>العنوان</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الأولوية</Label>
                <select
                  className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as "p1" | "p2" | "p3" | "p4" })}
                >
                  <option value="p1">P1</option>
                  <option value="p2">P2</option>
                  <option value="p3">P3</option>
                  <option value="p4">P4</option>
                </select>
              </div>
              <div>
                <Label>الحالة</Label>
                <select
                  className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as LifeTask["status"] })}
                >
                  <option value="inbox">Inbox</option>
                  <option value="active">Active</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>تاريخ التنفيذ</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
              <div>
                <Label>الوقت المتوقع (دقائق)</Label>
                <Input
                  type="number"
                  min={0}
                  value={String(form.estimatedTime)}
                  onChange={(e) => setForm({ ...form, estimatedTime: parseInt(e.target.value || "0", 10) })}
                />
              </div>
            </div>
            <div>
              <Label>ربط بهدف (اختياري)</Label>
              <select
                className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
                value={form.goalId}
                onChange={(e) => setForm({ ...form, goalId: e.target.value })}
              >
                <option value="">بدون ربط</option>
                {(yearData.goals ?? []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setModal(false)}>
                إلغاء
              </Button>
              <Button variant="gold" onClick={addTask}>
                حفظ
              </Button>
            </div>
          </div>
      </MotionModal>
    </ViewShell>
  );
}
