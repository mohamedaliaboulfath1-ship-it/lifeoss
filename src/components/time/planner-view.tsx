"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Input, Label } from "@/components/ui/input";
import { ScheduleSettingsPanel } from "@/components/time/schedule-settings-panel";
import { FocusTimer } from "@/components/time/focus-timer";
import { getWeekDates, today, uid } from "@/lib/utils";
import { DOMAIN_COLORS } from "@/lib/time/defaults";
import type { TimeBlock, UserTimeSettings, SuggestedSlot } from "@/types/time";

const VIEW_TABS = [
  { id: "week", label: "أسبوع" },
  { id: "day", label: "يوم" },
  { id: "month", label: "شهر" },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
const DAY_LABELS = ["سبت", "أحد", "إثن", "ثلا", "أرب", "خمي", "جمع"];

function blockStyle(block: TimeBlock) {
  const start = new Date(block.startAt);
  const end = new Date(block.endAt);
  const top = ((start.getHours() - 6) * 60 + start.getMinutes()) / 60;
  const height = Math.max(0.5, (end.getTime() - start.getTime()) / 3600000);
  const color = block.color ?? (block.domainId ? DOMAIN_COLORS[block.domainId] : "var(--gold)");
  return { top: `${top * 48}px`, height: `${height * 48}px`, borderColor: color, background: `${color}22` };
}

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
    const [blocksRes, settingsRes] = await Promise.all([
      fetch(`/api/time/blocks?start=${weekDates[0]}&end=${weekDates[6]}`),
      fetch("/api/time/settings"),
    ]);
    const bj = await blocksRes.json();
    const sj = await settingsRes.json();
    setBlocks(bj.blocks ?? []);
    setSettings(sj.settings ?? null);
    setLoading(false);
  }, [weekDates]);

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

  const dayDate = view === "day" ? today() : null;
  const displayDates = view === "day" && dayDate ? [dayDate] : view === "month" ? weekDates : weekDates;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Time Planner"
        subtitle="جدولة ذكية — Day · Week · Month · Drag & Drop"
      />

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
      ) : view === "month" ? (
        <Card className="p-4">
          <div className="text-sm font-bold mb-3">شهر — {blocks.length} كتلة</div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {blocks.map((b) => (
              <div key={b.id} className="flex justify-between text-sm p-2 rounded-sm bg-surface2/50 border border-border/40">
                <span>{b.title}</span>
                <span className="text-text3 text-xs">{new Date(b.startAt).toLocaleString("ar-SA")}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-2 overflow-x-auto">
          <div className="flex min-w-[700px]">
            <div className="w-10 shrink-0">
              {HOURS.map((h) => (
                <div key={h} className="h-12 text-[10px] text-text3 pr-1 text-left">{h}:00</div>
              ))}
            </div>
            {displayDates.map((date, di) => (
              <div key={date} className="flex-1 min-w-[90px] border-r border-border/30 relative">
                <div className="text-center text-[10px] font-bold py-1 border-b border-border/30 sticky top-0 bg-surface z-10">
                  {DAY_LABELS[di]} {date.slice(8)}
                </div>
                <div className="relative" style={{ height: HOURS.length * 48 }}>
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-border/20 hover:bg-gold/5 cursor-pointer"
                      style={{ top: (h - 6) * 48, height: 48 }}
                      onClick={() => {
                        setForm((f) => ({ ...f, date, startTime: `${String(h).padStart(2, "0")}:00` }));
                        setModal(true);
                        void suggestTime();
                      }}
                      role="presentation"
                    />
                  ))}
                  {blocks
                    .filter((b) => b.startAt.slice(0, 10) === date)
                    .map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        className="absolute left-0.5 right-0.5 rounded-sm border text-[10px] p-1 overflow-hidden text-right z-20 hover:brightness-110"
                        style={blockStyle(b)}
                        onClick={() => void markDone(b)}
                        title={`${b.title} — اضغط لإكمال`}
                      >
                        <div className="font-medium truncate">{b.title}</div>
                        <div className="text-text3">{b.status}</div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
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
