"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import type { JournalBlock, JournalBlockType } from "@/types/journal";
import type { MentionResult } from "@/types/journal";
import { createBlock } from "@/lib/journal/blocks";
import { JournalBlockEditor } from "./journal-block-editor";
import { JournalSlashMenu } from "./journal-slash-menu";
import { JournalMentionMenu } from "./journal-mention-menu";
import { useState } from "react";

interface BlockListProps {
  blocks: JournalBlock[];
  readOnly?: boolean;
  entryId: string;
  onChange: (blocks: JournalBlock[]) => void;
  onRelationsAdd?: (mention: MentionResult, blockId: string) => void;
}

export function JournalBlockList({
  blocks,
  readOnly,
  entryId,
  onChange,
  onRelationsAdd,
}: BlockListProps) {
  const [slash, setSlash] = useState<{ query: string; pos: DOMRect; blockId: string } | null>(null);
  const [mention, setMention] = useState<{ query: string; pos: DOMRect; blockId: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function updateBlock(id: string, patch: JournalBlock) {
    onChange(blocks.map((b) => (b.id === id ? patch : b)));
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const next = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({
      ...b,
      sortOrder: i,
    }));
    onChange(next);
  }

  function insertBlockAfter(blockId: string, type: JournalBlockType) {
    const idx = blocks.findIndex((b) => b.id === blockId);
    const nb = createBlock(type, "", idx + 1);
    const next = [...blocks];
    next.splice(idx + 1, 0, nb);
    onChange(next.map((b, i) => ({ ...b, sortOrder: i })));
    setSlash(null);
  }

  function applyMention(blockId: string, m: MentionResult) {
    const mentionBlock = createBlock("mention", m.label, 0);
    mentionBlock.metadata = {
      targetType: m.type,
      targetId: m.id,
      label: m.label,
      href: m.href,
    };
    const idx = blocks.findIndex((b) => b.id === blockId);
    const next = [...blocks];
    next.splice(idx + 1, 0, mentionBlock);
    onChange(next.map((b, i) => ({ ...b, sortOrder: i })));
    onRelationsAdd?.(m, mentionBlock.id);
    setMention(null);
  }

  async function uploadImage(file: File, blockId: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("entryId", entryId);
    form.append("blockId", blockId);
    const res = await fetch("/api/journal/images", { method: "POST", body: form });
    const json = await res.json();
    if (res.ok && json.image?.url) {
      const b = blocks.find((x) => x.id === blockId);
      if (b) {
        updateBlock(blockId, {
          ...b,
          metadata: { ...b.metadata, url: json.image.url, storagePath: json.image.storagePath },
        });
      }
    }
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {blocks.map((block) => (
              <JournalBlockEditor
                key={block.id}
                block={block}
                readOnly={readOnly}
                onChange={(b) => updateBlock(block.id, b)}
                onSlash={(q, rect) => setSlash({ query: q, pos: rect, blockId: block.id })}
                onMention={(q, rect) => setMention({ query: q, pos: rect, blockId: block.id })}
                onImageUpload={uploadImage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AnimatePresence>
        {slash && (
          <JournalSlashMenu
            query={slash.query}
            position={{ top: slash.pos.bottom + 4, left: slash.pos.left }}
            onSelect={(type) => insertBlockAfter(slash.blockId, type)}
            onClose={() => setSlash(null)}
          />
        )}
        {mention && (
          <JournalMentionMenu
            query={mention.query}
            position={{ top: mention.pos.bottom + 4, left: mention.pos.left }}
            onSelect={(m) => applyMention(mention.blockId, m)}
            onClose={() => setMention(null)}
          />
        )}
      </AnimatePresence>

      {!readOnly && (
        <button
          type="button"
          className="mt-4 text-sm text-text3 hover:text-gold2 transition-colors"
          onClick={() => onChange([...blocks, createBlock("text", "", blocks.length)])}
        >
          + فقرة جديدة
        </button>
      )}
    </>
  );
}
