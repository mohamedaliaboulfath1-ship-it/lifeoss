"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Input, Label } from "@/components/ui/input";
import { ScheduleSettingsPanel } from "@/components/time/schedule-settings-panel";
import { FocusTimer } from "@/components/time/focus-timer";
import { FocusDashboardPanel } from "@/components/time/focus-dashboard-panel";
import { TimeCalendar24h, TimeAgendaView } from "@/components/time/time-calendar-24h";
import { WeeklyPlanningPanel } from "@/components/time/weekly-planning-panel";
import { getWeekDates, today, uid } from "@/lib/utils";
import type { TimeBlock, UserTimeSettings, SuggestedSlot } from "@/types/time";

const VIEW_TABS = [
  { id: "week", label: "أسبوع" },
  { id: "day", label: "يوم" },
  { id: "month", label: "شهر" },
  { id: "agenda", label: "أجندة" },
];

export function PlannerView() {
  const [view, setView] = useState("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [settings, setSettings] = useState<UserTimeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedSlot[]>([]);
  const [form, setForm] = useState({
    title: "",
    date: today(),
    startTime: "19:00",
    duration: 60,
    blockType: "task" as TimeBlock["blockType"],
    domainId: "domain_career",
    taskId: "",
  });

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const load = useCallback(async () => {
    setLoading(true);
    const rangeStart = view === "month"
      ? new Date(weekDates[0]).toISOString().slice(0, 7) + "-01"
      : weekDates[0];
    const rangeEnd = view === "month"
      ? weekDates[6]
      : weekDates[6];

    const [blocksRes, settingsRes] = await Promise.all([
      fetch(`/api/time/blocks?start=${rangeStart}&end=${rangeEnd}`),
      fetch("/api/time/settings"),
    ]);
    const bj = await blocksRes.json();
    const sj = await settingsRes.json();
    setBlocks(bj.blocks ?? []);
    setSettings(sj.settings ?? null);
    setLoading(false);
  }, [weekDates, view]);

  useEffect(() => { void load(); }, [load]);

  async function suggestTime() {
    const res = await fetch("/api/time/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes: form.duration, title: form.title }),
    });
    const json = await res.json();
    setSuggestions(json.suggestions ?? []);
  }

  async function createBlock(slot?: SuggestedSlot) {
    const startAt = slot
      ? slot.startAt
      : new Date(`${form.date}T${form.startTime}:00`).toISOString();
    const endAt = slot
      ? slot.endAt
      : new Date(new Date(startAt).getTime() + form.duration * 60000).toISOString();

    await fetch("/api/time/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: uid(),
        title: form.title,
        startAt,
        endAt,
        blockType: form.blockType,
        domainId: form.domainId,
        taskId: form.taskId || undefined,
        estimatedMinutes: form.duration,
      }),
    });
    setModal(false);
    await load();
  }

  async function markDone(block: TimeBlock) {
    const mins = Math.round((new Date(block.endAt).getTime() - new Date(block.startAt).getTime()) / 60000);
    await fetch("/api/time/blocks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: block.id, status: "done", actualMinutes: mins }),
    });
    await load();
  }

  async function moveBlock(blockId: string, newStartAt: string, newEndAt: string) {
    await fetch("/api/time/blocks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: blockId, startAt: newStartAt, endAt: newEndAt }),
    });
    await load();
  }

  const displayDates = useMemo(() => {
    if (view === "day") return [today()];
    if (view === "month" || view === "agenda") return weekDates;
    return weekDates;
  }, [view, weekDates]);

  function openSlot(date: string, hour: number) {
    setForm((f) => ({
      ...f,
      date,
      startTime: `${String(hour).padStart(2, "0")}:00`,
    }));
    setModal(true);
    void suggestTime();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Time OS"
        subtitle="24 ساعة · Day · Week · Month · Agenda · Drag & Drop"
      />

      <FocusDashboardPanel blocks={blocks} settings={settings} />

      <WeeklyPlanningPanel weekDates={weekDates} blocks={blocks} settings={settings} />

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <Tabs tabs={VIEW_TABS} active={view} onChange={setView} />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setWeekOffset((w) => w - 1)}>←</Button>
          <Button variant="ghost" onClick={() => setWeekOffset(0)}>اليوم</Button>
          <Button variant="ghost" onClick={() => setWeekOffset((w) => w + 1)}>→</Button>
          <Button variant="gold" onClick={() => { setModal(true); void suggestTime(); }}>+ Time Block</Button>
        </div>
      </div>

      {settings && <ScheduleSettingsPanel settings={settings} onSaved={setSettings} />}

      {loading ? (
        <div className="h-96 skeleton-shimmer rounded-[10px]" />
      ) : view === "agenda" ? (
        <TimeAgendaView blocks={blocks} onBlockClick={(b) => void markDone(b)} />
      ) : view === "month" ? (
        <Card className="p-4">
          <div className="text-sm font-bold mb-3">شهر — {blocks.length} كتلة</div>
          <TimeAgendaView blocks={blocks} onBlockClick={(b) => void markDone(b)} />
        </Card>
      ) : (
        <TimeCalendar24h
          dates={displayDates}
          blocks={blocks}
          settings={settings}
          onSlotClick={openSlot}
          onBlockMove={moveBlock}
          onBlockClick={(b) => void markDone(b)}
        />
      )}

      <FocusTimer onComplete={() => void load()} />

      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold">Time Block جديد</h3>
            <div><Label>العنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>التاريخ</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>البداية</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
            </div>
            <div><Label>المدة (دقيقة)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: +e.target.value })} /></div>
            <Button variant="ghost" onClick={() => void suggestTime()}>اقتراح وقت تلقائي</Button>
            {suggestions.slice(0, 3).map((s) => (
              <button key={s.startAt} type="button" className="w-full text-right text-sm p-2 rounded-sm bg-surface2 hover:border-gold/40 border border-border/50" onClick={() => void createBlock(s)}>
                📅 {s.dayLabel}
              </button>
            ))}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setModal(false)}>إلغاء</Button>
              <Button variant="gold" onClick={() => void createBlock()}>حفظ</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
