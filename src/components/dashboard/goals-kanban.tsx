"use client";

import { DndContext, type DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { calcGoalProbability } from "@/lib/dashboard/goal-probability";
import { useGoalExpandOptional } from "@/contexts/goal-expand-context";
import type { ProGoal } from "@/types/lifeos";

const COLUMNS: { id: ProGoal["status"]; label: string; color: string }[] = [
  { id: "active", label: "نشط", color: "var(--teal)" },
  { id: "paused", label: "متوقف", color: "var(--amber2)" },
  { id: "done", label: "مكتمل", color: "var(--emerald)" },
  { id: "cancelled", label: "ملغي", color: "var(--coral)" },
];

interface GoalsKanbanProps {
  goals: ProGoal[];
  onStatusChange: (id: string, status: ProGoal["status"]) => void;
}

export function GoalsKanban({ goals, onStatusChange }: GoalsKanbanProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const target = event.over?.id as ProGoal["status"] | undefined;
    if (!target) return;
    const sourceGoal = goals.find((g) => g.id === event.active.id);
    if (!sourceGoal || sourceGoal.status === target) return;
    onStatusChange(sourceGoal.id, target);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const colGoals = goals.filter((g) => g.status === col.id);
          return (
            <KanbanColumn key={col.id} id={col.id}>
              <div
                className="text-xs font-bold mb-3 flex items-center gap-2"
                style={{ color: col.color }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: col.color }}
                />
                {col.label}
                <span className="text-text3 font-mono">({colGoals.length})</span>
              </div>
              <div className="space-y-2 min-h-[120px]">
                {colGoals.map((g) => (
                  <DraggableGoalCard
                    key={g.id}
                    goal={g}
                    color={col.color}
                    onStatusChange={onStatusChange}
                    columnId={col.id}
                  />
                ))}
                {!colGoals.length && (
                  <p className="text-text3 text-[11px] text-center py-6 opacity-50">
                    فارغ
                  </p>
                )}
              </div>
            </KanbanColumn>
          );
        })}
      </div>
    </DndContext>
  );
}

function KanbanColumn({
  id,
  children,
}: {
  id: ProGoal["status"];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[220px] rounded-md border transition-colors ${
        isOver ? "border-gold/40 bg-gold/5" : "border-transparent"
      }`}
    >
      <div className="p-2">{children}</div>
    </div>
  );
}

function DraggableGoalCard({
  goal,
  color,
  onStatusChange,
  columnId,
}: {
  goal: ProGoal;
  color: string;
  onStatusChange: (id: string, status: ProGoal["status"]) => void;
  columnId: ProGoal["status"];
}) {
  const router = useRouter();
  const expand = useGoalExpandOptional();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: goal.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.65 : 1,
  };
  const prob = calcGoalProbability({
    ...goal,
    target_date: goal.targetDate ?? goal.due,
  });

  function handleOpen(e: React.MouseEvent<HTMLDivElement>) {
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (expand) {
      expand.expandGoal(goal, rect);
    } else {
      router.push(`/goals/${goal.id}`);
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 cursor-pointer hover:border-gold/40 glass-premium transition-all hover:shadow-premium"
      onClick={handleOpen}
      {...listeners}
      {...attributes}
    >
      <div className="flex gap-2 items-start">
        <ProgressRing value={goal.progress ?? 0} size={40} strokeWidth={3} color={color} showValue suffix="%" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold mb-1 line-clamp-2">{goal.title}</div>
          {prob && <div className="text-[10px] mb-1 text-text3 line-clamp-1">{prob.text}</div>}
          {goal.level && <span className="text-[9px] text-text3">{levelLabel(goal.level)}</span>}
        </div>
      </div>
      {columnId !== "done" && columnId !== "cancelled" && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {COLUMNS.filter((c) => c.id !== columnId).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(goal.id, c.id);
              }}
              className="text-[9px] px-1.5 py-0.5 rounded bg-surface2 hover:bg-border text-text3"
            >
              → {c.label}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

function levelLabel(level: string) {
  const map: Record<string, string> = {
    vision: "رؤية",
    goal: "هدف",
    project: "مشروع",
  };
  return map[level] ?? level;
}
