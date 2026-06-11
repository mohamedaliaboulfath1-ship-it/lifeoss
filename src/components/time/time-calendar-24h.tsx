"use client";

import { useCallback, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import {
  CALENDAR_HEIGHT_PX,
  HOUR_HEIGHT_PX,
  HOURS_24,
  blockPosition,
  hourLabel,
  workOverlayStyle,
} from "@/lib/time/calendar-grid";
import { DOMAIN_COLORS } from "@/lib/time/defaults";
import type { TimeBlock, UserTimeSettings } from "@/types/time";

const DAY_LABELS = ["سبت", "أحد", "إثن", "ثلا", "أرب", "خمي", "جمع"];

interface TimeCalendar24hProps {
  dates: string[];
  blocks: TimeBlock[];
  settings: UserTimeSettings | null;
  onSlotClick: (date: string, hour: number) => void;
  onBlockMove?: (blockId: string, newStartAt: string, newEndAt: string) => void;
  onBlockClick?: (block: TimeBlock) => void;
}

function blockColor(block: TimeBlock) {
  return block.color ?? (block.domainId ? DOMAIN_COLORS[block.domainId] : "var(--gold)");
}

export function TimeCalendar24h({
  dates,
  blocks,
  settings,
  onSlotClick,
  onBlockMove,
  onBlockClick,
}: TimeCalendar24hProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !onBlockMove) return;
      const blockId = String(active.id);
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;

      const overData = over.data.current as { date?: string; hour?: number } | undefined;
      if (!overData?.date || overData.hour == null) return;

      const duration = new Date(block.endAt).getTime() - new Date(block.startAt).getTime();
      const newStart = new Date(`${overData.date}T${String(overData.hour).padStart(2, "0")}:00:00`);
      const newEnd = new Date(newStart.getTime() + duration);
      onBlockMove(blockId, newStart.toISOString(), newEnd.toISOString());
    },
    [blocks, onBlockMove]
  );

  const blocksByDate = useMemo(() => {
    const map: Record<string, TimeBlock[]> = {};
    for (const d of dates) map[d] = [];
    for (const b of blocks) {
      const d = b.startAt.slice(0, 10);
      if (map[d]) map[d].push(b);
    }
    return map;
  }, [dates, blocks]);

  const grid = (
    <Card className="p-2 overflow-x-auto">
      <div className="flex min-w-[720px]">
        <div className="w-12 shrink-0 sticky left-0 bg-surface z-20">
          {HOURS_24.map((h) => (
            <div
              key={h}
              className="text-[9px] text-text3 pr-1 text-left border-t border-border/10"
              style={{ height: HOUR_HEIGHT_PX }}
            >
              {hourLabel(h)}
            </div>
          ))}
        </div>

        {dates.map((date, di) => {
          const overlay = settings ? workOverlayStyle(settings, date) : null;
          const dayBlocks = blocksByDate[date] ?? [];

          return (
            <div key={date} className="flex-1 min-w-[100px] border-r border-border/30 relative">
              <div className="text-center text-[10px] font-bold py-1 border-b border-border/30 sticky top-0 bg-surface z-10">
                {DAY_LABELS[di % 7]} {date.slice(8)}
              </div>
              <div className="relative" style={{ height: CALENDAR_HEIGHT_PX }}>
                {overlay && (
                  <div
                    className="absolute left-0 right-0 bg-rose/8 border-y border-rose/20 z-[5] pointer-events-none"
                    style={{ top: overlay.top, height: overlay.height }}
                    title="ساعات العمل — غير متاحة للجدولة"
                  >
                    <span className="absolute top-1 right-1 text-[8px] text-rose2/80">عمل</span>
                  </div>
                )}

                {HOURS_24.map((h) => (
                  <div
                    key={h}
                    id={`slot-${date}-${h}`}
                    data-date={date}
                    data-hour={h}
                    className="absolute w-full border-t border-border/15 hover:bg-sky/5 cursor-pointer transition-colors"
                    style={{ top: h * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
                    onClick={() => onSlotClick(date, h)}
                    role="presentation"
                  />
                ))}

                {dayBlocks.map((b) => {
                  const pos = blockPosition(b);
                  const color = blockColor(b);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      draggable={!!onBlockMove}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("blockId", b.id);
                        e.dataTransfer.setData("date", date);
                      }}
                      className="absolute left-0.5 right-0.5 rounded-sm border text-[9px] p-0.5 overflow-hidden text-right z-20 hover:brightness-110 transition-all"
                      style={{
                        top: pos.top,
                        height: pos.height,
                        borderColor: color,
                        background: `${color}33`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlockClick?.(b);
                      }}
                      title={b.title}
                    >
                      <div className="font-medium truncate">{b.title}</div>
                      <div className="text-text3 truncate">{b.blockType}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );

  if (onBlockMove) {
    return (
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {grid}
      </DndContext>
    );
  }

  return grid;
}

/** Agenda list view — all blocks sorted by time */
export function TimeAgendaView({
  blocks,
  onBlockClick,
}: {
  blocks: TimeBlock[];
  onBlockClick?: (block: TimeBlock) => void;
}) {
  const sorted = useMemo(
    () => [...blocks].sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [blocks]
  );

  const grouped = useMemo(() => {
    const g: Record<string, TimeBlock[]> = {};
    for (const b of sorted) {
      const d = b.startAt.slice(0, 10);
      if (!g[d]) g[d] = [];
      g[d].push(b);
    }
    return Object.entries(g);
  }, [sorted]);

  return (
    <Card className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
      {grouped.length === 0 ? (
        <div className="text-sm text-text3 text-center py-8">لا أحداث مجدولة</div>
      ) : (
        grouped.map(([date, dayBlocks]) => (
          <div key={date}>
            <div className="text-xs font-bold text-gold2 mb-2 sticky top-0 bg-surface py-1">
              {new Date(`${date}T12:00:00`).toLocaleDateString("ar-SA", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className="space-y-1">
              {dayBlocks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="w-full flex items-center gap-3 text-sm p-2 rounded-sm hover:bg-surface2 border border-transparent hover:border-border/50 text-right"
                  onClick={() => onBlockClick?.(b)}
                >
                  <span className="text-[10px] font-mono text-text3 w-20 shrink-0">
                    {new Date(b.startAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="flex-1 font-medium truncate">{b.title}</span>
                  <span className="text-[10px] text-text3">{b.status}</span>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </Card>
  );
}
