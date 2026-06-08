"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { CareerRoadmapStage } from "@/types/lifeos";

interface Props {
  stages: CareerRoadmapStage[];
  onReorder: (order: string[]) => void;
  onDelete: (id: string) => void;
}

export function CareerRoadmapDnd({ stages, onReorder, onDelete }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(stages, oldIndex, newIndex);
    onReorder(reordered.map((s) => s.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0">
          {stages.map((stage, idx) => (
            <SortableStage key={stage.id} stage={stage} index={idx} total={stages.length} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableStage({
  stage,
  index,
  total,
  onDelete,
}: {
  stage: CareerRoadmapStage;
  index: number;
  total: number;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-4 pb-6">
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 cursor-grab active:cursor-grabbing ${
            stage.status === "active" ? "border-gold bg-gold/20 text-gold2" : "border-border bg-surface2"
          }`}
          {...attributes}
          {...listeners}
        >
          {index + 1}
        </div>
        {index < total - 1 && <div className="w-0.5 flex-1 bg-border mt-1 min-h-[24px]" />}
      </div>
      <div className="flex-1 border border-border rounded-sm p-3 bg-surface2/40">
        <div className="flex justify-between items-start">
          <div className="font-bold">{stage.title}</div>
          <div className="flex gap-2">
            <span className="text-[10px] text-text3 cursor-grab" {...attributes} {...listeners}>⠿ سحب</span>
            <button type="button" className="text-xs text-red2 hover:underline" onClick={() => onDelete(stage.id)}>
              حذف
            </button>
          </div>
        </div>
        <div className="text-xs text-text3">{stage.from ?? "—"} → {stage.to ?? stage.targetDate ?? "مستمر"}</div>
        {stage.salaryRange && <div className="text-xs text-emerald2 mt-1">💰 {stage.salaryRange}</div>}
        {stage.focus.length > 0 && <div className="text-xs mt-2">{stage.focus.join(" · ")}</div>}
        <ProgressBar value={stage.progressPct ?? 0} color="var(--gold)" className="h-1 mt-2" />
      </div>
    </div>
  );
}
