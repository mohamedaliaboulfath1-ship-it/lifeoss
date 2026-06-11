"use client";
import { ViewShell } from "@/components/motion/view-shell";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLifeOS } from "@/contexts/lifeos-context";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { MiniChart } from "@/components/ui/mini-chart";
import { HabitCard } from "@/components/habits/habit-card";
import { HabitSchedulePicker } from "@/components/habits/habit-schedule-picker";
import type { FrequencyType } from "@/lib/habits/schedule";
import { SYSTEM_DOMAINS } from "@/lib/domains";
import { today } from "@/lib/utils";
import type { YearPayload, Goal } from "@/types/lifeos";
import type { EnrichedHabit } from "@/types/para";

interface Props {
  yearData: YearPayload;
  forceAddModal?: boolean;
  onAddModalClose?: () => void;
}

export function HabitsParaView({ yearData, forceAddModal, onAddModalClose }: Props) {
  const { refreshSilent, patchYearData } = useLifeOS();
  const { toast } = useToast();
  const [tab, setTab] = useState("habits");
  const [enriched, setEnriched] = useState<EnrichedHabit[]>([]);
  const [logs, setLogs] = useState(yearData.habitLogs ?? {});
  const [domainFilter, setDomainFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    name: "",
    cat: "health",
    goalLink: "",
    projectId: "",
    why: "",
    impact: "medium" as const,
    priority: "normal" as const,
    frequencyType: "daily" as FrequencyType,
    frequencyValue: {} as Record<string, unknown>,
  });

  const showModal = modalOpen || !!forceAddModal;
  const goals = yearData.goals ?? [];
  const projects = goals.filter((g) => g.level === "project");
  const activeGoals = goals.filter((g) => g.level === "goal" || !g.level);

  const reload = useCallback(async () => {
    const res = await fetch("/api/habits");
    if (!res.ok) return;
    const json = await res.json();
    setEnriched(json.enriched ?? []);
    setLogs(json.habitLogs ?? {});
    patchYearData((y) => ({
      ...y,
      habits: json.habits ?? [],
      habitLogs: json.habitLogs ?? {},
    }));
    void refreshSilent();
  }, [patchYearData, refreshSilent]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    if (domainFilter === "all") return enriched;
    const domain = SYSTEM_DOMAINS.find((d) => d.slug === domainFilter);
    return enriched.filter(
      (h) => h.cat === domainFilter || h.domainId === domain?.id
    );
  }, [domainFilter, enriched]);

  const todayHabits = enriched.filter((h) => h.active && h.dueToday);
  const todayDone = todayHabits.filter((h) => h.doneToday).length;
  const avgAdherence = enriched.length
    ? Math.round(enriched.reduce((s, h) => s + h.adherencePct, 0) / enriched.length)
    : 0;
  const maxLifeImpact = enriched.length
    ? Math.max(...enriched.map((h) => h.lifeScoreContribution))
    : 0;

  async function toggle(habitId: string) {
    const date = today();
    const prev = logs[habitId]?.[date] ?? false;
    const next = !prev;
    setPending((s) => new Set(s).add(habitId));
    setLogs((l) => ({ ...l, [habitId]: { ...(l[habitId] ?? {}), [date]: next } }));
    setEnriched((list) =>
      list.map((h) => (h.id === habitId ? { ...h, doneToday: next } : h))
    );
    try {
      const res = await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date }),
      });
      if (!res.ok) throw new Error("fail");
      await reload();
    } catch {
      setLogs((l) => ({ ...l, [habitId]: { ...(l[habitId] ?? {}), [date]: prev } }));
      toast("تعذّر التحديث", "error");
    } finally {
      setPending((s) => {
        const n = new Set(s);
        n.delete(habitId);
        return n;
      });
    }
  }

  async function addHabit() {
    if (!form.name.trim()) return;
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast(j.migrationRequired ? "شغّل migration 014 في Supabase" : "فشل الإضافة", "error");
      return;
    }
    setForm({ name: "", cat: "health", goalLink: "", projectId: "", why: "", impact: "medium", priority: "normal", frequencyType: "daily", frequencyValue: {} });
    setModalOpen(false);
    onAddModalClose?.();
    await reload();
    toast("تم ربط العادة بالهدف", "success");
  }

  return (
    <ViewShell>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <Card className="p-4">
          <div className="text-2xl font-black text-emerald2">{todayDone}/{todayHabits.length}</div>
          <div className="text-[11px] text-text3">إنجاز اليوم</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-black text-gold2">{avgAdherence}%</div>
          <div className="text-[11px] text-text3">متوسط الالتزام</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-black text-sky2">{enriched.length}</div>
          <div className="text-[11px] text-text3">عادات مرتبطة</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-black text-purple2">{maxLifeImpact}%</div>
          <div className="text-[11px] text-text3">أعلى تأثير Life Score</div>
        </Card>
      </div>

      <Tabs
        tabs={[
          { id: "habits", label: "🎯 عاداتي" },
          { id: "today", label: "📅 اليوم" },
          { id: "analytics", label: "📊 تحليلات" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDomainFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs border ${domainFilter === "all" ? "bg-gold/20 border-gold/60 text-gold2" : "border-border2 text-text3"}`}
          >
            الكل
          </button>
          {SYSTEM_DOMAINS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDomainFilter(d.slug)}
              className={`px-3 py-1.5 rounded-full text-xs border ${domainFilter === d.slug ? "bg-gold/20 border-gold/60 text-gold2" : "border-border2 text-text3"}`}
            >
              {d.icon} {d.nameAr}
            </button>
          ))}
        </div>
      </Card>

      {tab === "habits" && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              onToggle={() => toggle(h.id)}
              pending={pending.has(h.id)}
            />
          ))}
          {!filtered.length && (
            <Card className="p-8 col-span-full text-center text-text3 text-sm">
              لا عادات — أضف عادة مرتبطة بهدف أو مشروع
            </Card>
          )}
        </div>
      )}

      {tab === "today" && (
        <div className="space-y-3">
          {!todayHabits.length && (
            <Card className="p-6 text-center text-text3 text-sm glass-premium">لا عادات مطلوبة اليوم حسب الجدول</Card>
          )}
          {todayHabits.map((h) => (
            <Card key={h.id} className="p-4 flex items-center justify-between gap-4 glass-premium">
              <div>
                <div className="font-bold">{h.name}</div>
                <div className="text-xs text-text3">{h.scheduleLabel} · {h.goalTitle ?? h.projectTitle ?? h.domainName}</div>
              </div>
              <Button variant={h.doneToday ? "ghost" : "gold"} size="sm" onClick={() => toggle(h.id)}>
                {h.doneToday ? "✓ تم" : "إنجاز"}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {tab === "analytics" && (
        <div className="grid xl:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">التزام حسب العادة</div>
            <MiniChart
              type="bar"
              color="var(--emerald)"
              data={enriched.slice(0, 8).map((h) => ({ label: h.name.slice(0, 6), value: h.adherencePct }))}
            />
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">مساهمة Life Score</div>
            <MiniChart
              type="bar"
              color="var(--gold)"
              data={enriched.slice(0, 8).map((h) => ({ label: h.name.slice(0, 6), value: h.lifeScoreContribution }))}
            />
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="gold" onClick={() => setModalOpen(true)}>+ عادة مرتبطة</Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border2 rounded-[10px] w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold">⚡ عادة مرتبطة بـ PARA</h3>
            <div>
              <Label>اسم العادة</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>المجال (Area)</Label>
              <select
                className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
                value={form.cat}
                onChange={(e) => setForm({ ...form, cat: e.target.value })}
              >
                {SYSTEM_DOMAINS.map((d) => (
                  <option key={d.id} value={d.slug}>{d.nameAr}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>الهدف المرتبط</Label>
              <select
                className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
                value={form.goalLink}
                onChange={(e) => setForm({ ...form, goalLink: e.target.value })}
              >
                <option value="">— اختر هدفاً —</option>
                {activeGoals.map((g: Goal) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>المشروع</Label>
              <select
                className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                <option value="">— اختياري —</option>
                {projects.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>لماذا أفعلها؟</Label>
              <Input value={form.why} onChange={(e) => setForm({ ...form, why: e.target.value })} placeholder="ربط بالهدف طويل المدى" />
            </div>
            <HabitSchedulePicker
              frequencyType={form.frequencyType}
              frequencyValue={form.frequencyValue}
              onChange={(frequencyType, frequencyValue) => setForm({ ...form, frequencyType, frequencyValue })}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>التأثير</Label>
                <select className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm" value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value as "medium" })}>
                  <option value="low">منخفض</option>
                  <option value="medium">متوسط</option>
                  <option value="high">عالي</option>
                </select>
              </div>
              <div>
                <Label>الأولوية</Label>
                <select className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as "normal" })}>
                  <option value="normal">عادي</option>
                  <option value="high">عالي</option>
                  <option value="critical">حرج</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setModalOpen(false); onAddModalClose?.(); }}>إلغاء</Button>
              <Button variant="gold" onClick={addHabit}>حفظ وربط</Button>
            </div>
          </div>
        </div>
      )}
    </ViewShell>
  );
}
