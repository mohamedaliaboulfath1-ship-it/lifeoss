"use client";
import { ViewShell } from "@/components/motion/view-shell";

import { useEffect, useMemo, useState } from "react";
import { useLifeOS } from "@/contexts/lifeos-context";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { LazyChart } from "@/components/ui/lazy-chart";
import { calcOverallHabitPct, calcStreak } from "@/lib/calculations";
import { getWeekDates, today } from "@/lib/utils";
import type { YearPayload } from "@/types/lifeos";

interface HabitsViewProps {
  yearData: YearPayload;
  /** @deprecated use internal silent refresh */
  onRefresh?: () => void;
  forceAddModal?: boolean;
  onAddModalClose?: () => void;
}

export function HabitsView({
  yearData,
  forceAddModal,
  onAddModalClose,
}: HabitsViewProps) {
  const { refreshSilent, patchYearData } = useLifeOS();
  const { toast } = useToast();
  const [tab, setTab] = useState("tracker");
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [catFilter, setCatFilter] = useState("all");
  const showModal = modalOpen || !!forceAddModal;
  const [name, setName] = useState("");
  const [habits, setHabits] = useState(yearData.habits ?? []);
  const [logs, setLogs] = useState(yearData.habitLogs ?? {});
  const [pending, setPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    setHabits(yearData.habits ?? []);
    setLogs(yearData.habitLogs ?? {});
  }, [yearData.habits, yearData.habitLogs]);

  function toggleKey(habitId: string, date: string) {
    return `${habitId}:${date}`;
  }

  async function syncHabits() {
    const res = await fetch("/api/habits");
    if (!res.ok) return;
    const json = await res.json();
    setHabits(json.habits ?? []);
    setLogs(json.habitLogs ?? {});
    patchYearData((y) => ({
      ...y,
      habits: json.habits ?? [],
      habitLogs: json.habitLogs ?? {},
    }));
    void refreshSilent();
  }
  const week = getWeekDates(weekOffset);
  const pct = calcOverallHabitPct(yearData, weekOffset);

  const dayLabels = week.map((d) =>
    new Date(d).toLocaleDateString("ar-SA", { weekday: "short", day: "numeric" })
  );

  const categories = [
    { id: "all", label: "الكل" },
    { id: "health", label: "الصحة" },
    { id: "career", label: "المهنة" },
    { id: "discipline", label: "الانضباط" },
    { id: "spiritual", label: "الروحاني" },
    { id: "learning", label: "التعلم" },
    { id: "finance", label: "المالية" },
  ];

  const filteredHabits = useMemo(
    () => (catFilter === "all" ? habits : habits.filter((h) => h.cat === catFilter)),
    [catFilter, habits]
  );

  const habitBestStreak = useMemo(
    () =>
      filteredHabits.map((h) => ({
        ...h,
        streak: calcStreak(h.id, logs),
      })),
    [filteredHabits, logs]
  );

  const weeklyCompletion = useMemo(
    () =>
      week.map((date) => {
        const done = filteredHabits.filter((h) => logs[h.id]?.[date]).length;
        return {
          label: new Date(date).toLocaleDateString("ar-SA", { weekday: "short" }),
          value: done,
        };
      }),
    [filteredHabits, logs, week]
  );

  const monthlyCompletion = useMemo(() => {
    const bucket = [0, 0, 0, 0];
    const now = new Date();
    now.setDate(1);
    for (let i = 0; i < 28; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const date = d.toISOString().slice(0, 10);
      const weekIdx = Math.floor(i / 7);
      bucket[weekIdx] += filteredHabits.filter((h) => logs[h.id]?.[date]).length;
    }
    return bucket.map((value, i) => ({ label: `أ${i + 1}`, value }));
  }, [filteredHabits, logs]);

  const heatmapDates = useMemo(() => {
    const arr: string[] = [];
    const d = new Date();
    d.setDate(d.getDate() - 27);
    for (let i = 0; i < 28; i++) {
      const current = new Date(d);
      current.setDate(d.getDate() + i);
      arr.push(current.toISOString().slice(0, 10));
    }
    return arr;
  }, []);

  const heatmap = useMemo(
    () =>
      heatmapDates.map((d) => {
        const done = filteredHabits.filter((h) => logs[h.id]?.[d]).length;
        const ratio = filteredHabits.length ? done / filteredHabits.length : 0;
        return { date: d, ratio, done };
      }),
    [filteredHabits, heatmapDates, logs]
  );

  async function toggle(habitId: string, date: string) {
    const key = toggleKey(habitId, date);
    const prev = logs[habitId]?.[date] ?? false;
    const next = !prev;

    setLogs((l) => ({
      ...l,
      [habitId]: { ...(l[habitId] ?? {}), [date]: next },
    }));
    setPending((s) => new Set(s).add(key));
    patchYearData((y) => ({
      ...y,
      habitLogs: {
        ...(y.habitLogs ?? {}),
        [habitId]: { ...(y.habitLogs?.[habitId] ?? {}), [date]: next },
      },
    }));

    try {
      const res = await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date }),
      });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setLogs((l) => ({
        ...l,
        [habitId]: { ...(l[habitId] ?? {}), [date]: json.done },
      }));
      void refreshSilent();
    } catch {
      setLogs((l) => ({
        ...l,
        [habitId]: { ...(l[habitId] ?? {}), [date]: prev },
      }));
      patchYearData((y) => ({
        ...y,
        habitLogs: {
          ...(y.habitLogs ?? {}),
          [habitId]: { ...(y.habitLogs?.[habitId] ?? {}), [date]: prev },
        },
      }));
      toast("تعذّر تحديث العادة", "error");
    } finally {
      setPending((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    }
  }

  async function addHabit() {
    if (!name.trim()) return;
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, cat: "prod", freq: "daily" }),
    });
    if (!res.ok) {
      toast("فشل إضافة العادة", "error");
      return;
    }
    setName("");
    setModalOpen(false);
    onAddModalClose?.();
    await syncHabits();
  }

  async function removeHabit(id: string) {
    if (!confirm("حذف العادة؟")) return;
    setHabits((h) => h.filter((x) => x.id !== id));
    const res = await fetch(`/api/habits?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("فشل الحذف", "error");
      await syncHabits();
      return;
    }
    await syncHabits();
  }

  const todayDone = habits.filter((h) => logs[h.id]?.[today()]).length;
  const maxStreak = habits.length
    ? Math.max(...habits.map((h) => calcStreak(h.id, logs)), 0)
    : 0;
  const lifeContribution = Math.min(100, Math.round((pct * 0.35 + Math.min(100, maxStreak * 3)) / 2));
  const consistency = habits.length ? Math.round((todayDone / habits.length) * 100) : 0;

  return (
    <ViewShell>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <Card className="p-4">
          <div className="text-2xl font-black text-gold2">{pct}%</div>
          <div className="text-[11px] text-text3">إنجاز الأسبوع</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-black text-emerald2">
            {todayDone}/{habits.length}
          </div>
          <div className="text-[11px] text-text3">اليوم</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-black text-sky2">{habits.length}</div>
          <div className="text-[11px] text-text3">عادات نشطة</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-black text-purple2">{maxStreak}</div>
          <div className="text-[11px] text-text3">أطول سلسلة (يوم)</div>
        </Card>
      </div>

      <Tabs
        tabs={[
          { id: "tracker", label: "🧭 Tracker" },
          { id: "analytics", label: "📊 Analytics" },
          { id: "calendar", label: "🗓️ Calendar" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card className="p-4">
        <div className="text-xs text-text3 mb-2">تصنيف العادات</div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCatFilter(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer ${
                catFilter === c.id
                  ? "bg-gold/20 border-gold/60 text-gold2"
                  : "border-border2 text-text3 hover:text-text"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Card>

      {tab === "tracker" && (
        <>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setWeekOffset((w) => w - 1)}>
              ← الأسبوع السابق
            </Button>
            <span className="text-text3 text-xs font-mono">أسبوع {week[0]} — {week[6]}</span>
            <Button variant="ghost" onClick={() => setWeekOffset((w) => w + 1)}>
              الأسبوع التالي →
            </Button>
          </div>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-text3 text-xs">
                  <th className="text-right p-3 font-normal">العادة</th>
                  {dayLabels.map((l) => (
                    <th key={l} className="p-2 font-normal text-center">
                      {l}
                    </th>
                  ))}
                  <th className="p-2 text-center">أفضل سلسلة</th>
                  <th className="p-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {habitBestStreak.map((h) => (
                  <tr key={h.id} className="border-b border-border/50">
                    <td className="p-3 font-medium">{h.name}</td>
                    {week.map((d) => {
                      const done = logs[h.id]?.[d];
                      const isPending = pending.has(toggleKey(h.id, d));
                      return (
                        <td key={d} className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggle(h.id, d)}
                            className={`w-7 h-7 rounded-md border-2 mx-auto flex items-center justify-center transition-colors cursor-pointer ${
                              done
                                ? "bg-sky border-sky text-white"
                                : "border-border2 hover:border-gold/50"
                            } ${isPending ? "opacity-70 animate-pulse" : ""}`}
                          >
                            {done ? "✓" : ""}
                          </button>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center text-gold2 font-bold">{h.streak} يوم</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="text-rose2 text-xs cursor-pointer"
                        onClick={() => removeHabit(h.id)}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!habitBestStreak.length && (
              <p className="text-center text-text3 py-8 text-sm">لا عادات ضمن هذا التصنيف</p>
            )}
          </Card>
        </>
      )}

      {tab === "analytics" && (
        <div className="grid xl:grid-cols-3 gap-4">
          <Card className="p-4 xl:col-span-2">
            <div className="text-sm font-bold mb-3">إنجاز أسبوعي</div>
            <LazyChart data={weeklyCompletion} type="bar" color="var(--sky)" />
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">إنجاز شهري (4 أسابيع)</div>
            <LazyChart data={monthlyCompletion} type="bar" color="var(--gold)" />
          </Card>
          <Card className="p-4 xl:col-span-2">
            <div className="text-sm font-bold mb-3">لوحة الرؤى</div>
            <div className="space-y-2 text-sm">
              <div className="p-3 rounded-sm bg-surface2 border border-border2">
                أعلى اتساق اليوم: <strong>{consistency}%</strong> من العادات المكتملة.
              </div>
              <div className="p-3 rounded-sm bg-surface2 border border-border2">
                أقوى سلسلة حالية: <strong>{maxStreak} يوم</strong>.
              </div>
              <div className="p-3 rounded-sm bg-gold/10 border border-gold/30 text-gold2">
                مساهمة العادات في Life Score: <strong>{lifeContribution}%</strong>.
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">أفضل السلاسل</div>
            <ul className="space-y-2 text-sm">
              {habitBestStreak.slice(0, 5).map((h) => (
                <li key={h.id} className="flex justify-between border-b border-border/40 pb-1">
                  <span>{h.name}</span>
                  <span className="text-gold2 font-bold">{h.streak} يوم</span>
                </li>
              ))}
              {!habitBestStreak.length && <li className="text-text3">لا بيانات</li>}
            </ul>
          </Card>
        </div>
      )}

      {tab === "calendar" && (
        <Card className="p-4">
          <div className="text-sm font-bold mb-3">Habit Heatmap (آخر 4 أسابيع)</div>
          <div className="grid grid-cols-7 gap-2">
            {heatmap.map((cell) => (
              <div
                key={cell.date}
                className="aspect-square rounded-sm border border-border2"
                style={{
                  background:
                    cell.ratio >= 0.9
                      ? "rgba(51, 214, 170, 0.8)"
                      : cell.ratio >= 0.6
                        ? "rgba(80, 170, 255, 0.7)"
                        : cell.ratio >= 0.3
                          ? "rgba(255, 208, 94, 0.65)"
                          : "rgba(255,255,255,0.04)",
                }}
                title={`${cell.date} • ${cell.done}/${filteredHabits.length}`}
              />
            ))}
          </div>
          <div className="text-xs text-text3 mt-3">الألوان تمثل نسبة الإنجاز اليومية حسب التصنيف المختار</div>
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border2 rounded-[10px] w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold">⚡ عادة جديدة</h3>
            <div>
              <Label>اسم العادة</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setModalOpen(false);
                  onAddModalClose?.();
                }}
              >
                إلغاء
              </Button>
              <Button variant="gold" onClick={addHabit}>
                حفظ
              </Button>
            </div>
          </div>
        </div>
      )}
    </ViewShell>
  );
}
