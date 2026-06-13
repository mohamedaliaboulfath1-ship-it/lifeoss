"use client";

import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JournalBlock } from "@/types/journal";
import { applyRichFormat } from "./journal-format-toolbar";

interface BlockEditorProps {
  block: JournalBlock;
  readOnly?: boolean;
  onChange: (block: JournalBlock) => void;
  onSlash: (query: string, rect: DOMRect) => void;
  onMention: (query: string, rect: DOMRect) => void;
  onImageUpload?: (file: File, blockId: string) => void;
}

export function JournalBlockEditor({
  block,
  readOnly,
  onChange,
  onSlash,
  onMention,
  onImageUpload,
}: BlockEditorProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: readOnly,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleInput(e: React.FormEvent<HTMLElement>) {
    const el = e.currentTarget;
    const val = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      ? el.value
      : (el as HTMLDivElement).innerHTML;
    onChange({ ...block, content: val });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (readOnly) return;
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") { e.preventDefault(); applyRichFormat("bold"); }
      if (e.key === "i") { e.preventDefault(); applyRichFormat("italic"); }
      if (e.key === "u") { e.preventDefault(); applyRichFormat("underline"); }
    }
    const el = e.currentTarget as HTMLElement;
    const text = el.textContent ?? "";
    if (e.key === "/" && text.endsWith("/")) {
      onSlash("", el.getBoundingClientRect());
    }
    if (e.key === "@" || (text.includes("@") && !text.endsWith(" "))) {
      const at = text.lastIndexOf("@");
      if (at >= 0) onMention(text.slice(at + 1), el.getBoundingClientRect());
    }
  }

  const editableProps = {
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    suppressContentEditableWarning: true,
  };

  const renderContent = () => {
    switch (block.type) {
      case "heading1":
        return (
          <div
            {...editableProps}
            contentEditable={!readOnly}
            className="text-3xl font-black text-text outline-none min-h-[1.5em]"
            dangerouslySetInnerHTML={{ __html: block.content || "عنوان رئيسي" }}
          />
        );
      case "heading2":
        return (
          <div
            {...editableProps}
            contentEditable={!readOnly}
            className="text-xl font-bold text-gold2 outline-none min-h-[1.4em]"
            dangerouslySetInnerHTML={{ __html: block.content || "عنوان فرعي" }}
          />
        );
      case "heading3":
        return (
          <div
            {...editableProps}
            contentEditable={!readOnly}
            className="text-lg font-semibold text-text outline-none"
            dangerouslySetInnerHTML={{ __html: block.content || "عنوان" }}
          />
        );
      case "quote":
        return (
          <blockquote className="border-r-4 border-gold/50 pr-4 text-text2 italic">
            <div
              {...editableProps}
              contentEditable={!readOnly}
              className="outline-none"
              dangerouslySetInnerHTML={{ __html: block.content || "اقتباس…" }}
            />
          </blockquote>
        );
      case "callout":
        return (
          <div className="rounded-xl border border-sky2/30 bg-sky/10 p-4">
            <div
              {...editableProps}
              contentEditable={!readOnly}
              className="outline-none text-sm"
              dangerouslySetInnerHTML={{ __html: block.content || "💡 ملاحظة مهمة" }}
            />
          </div>
        );
      case "divider":
        return <hr className="border-border2 my-2" />;
      case "code":
        return (
          <pre className="rounded-lg bg-surface2 border border-border p-4 font-mono text-sm overflow-x-auto">
            <code
              {...editableProps}
              contentEditable={!readOnly}
              className="outline-none block whitespace-pre-wrap"
            >
              {block.content || "// كود"}
            </code>
          </pre>
        );
      case "checklist":
        return (
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={!!block.checked}
              disabled={readOnly}
              onChange={(e) => onChange({ ...block, checked: e.target.checked })}
              className="mt-1 accent-[var(--gold)]"
            />
            <div
              {...editableProps}
              contentEditable={!readOnly}
              className={cn(
                "flex-1 outline-none text-sm",
                block.checked && "line-through text-text3"
              )}
              dangerouslySetInnerHTML={{ __html: block.content || "مهمة" }}
            />
          </label>
        );
      case "bullet":
      case "numbered":
        return (
          <ul className={block.type === "numbered" ? "list-decimal mr-5" : "list-disc mr-5"}>
            {(block.items ?? [""]).map((item, i) => (
              <li key={i} className="text-sm mb-1">
                <input
                  className="w-full bg-transparent outline-none border-none text-text"
                  value={item}
                  readOnly={readOnly}
                  onChange={(e) => {
                    const items = [...(block.items ?? [""])];
                    items[i] = e.target.value;
                    onChange({ ...block, items });
                  }}
                />
              </li>
            ))}
            {!readOnly && (
              <button
                type="button"
                className="text-xs text-text3 hover:text-gold2 mt-1"
                onClick={() => onChange({ ...block, items: [...(block.items ?? []), ""] })}
              >
                + عنصر
              </button>
            )}
          </ul>
        );
      case "image":
        return (
          <ImageBlock
            block={block}
            readOnly={readOnly}
            onChange={onChange}
            onUpload={onImageUpload}
          />
        );
      case "mention":
      case "goal":
      case "project":
      case "task":
      case "book":
      case "habit":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky/15 border border-sky2/30 text-sm text-sky2">
            <span>@{block.metadata?.label as string ?? block.content}</span>
          </div>
        );
      case "date":
        return (
          <input
            type="date"
            value={block.content}
            readOnly={readOnly}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm"
          />
        );
      case "embed":
      case "video":
        return (
          <input
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm font-mono"
            placeholder="https://..."
            value={block.content}
            readOnly={readOnly}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            dir="ltr"
          />
        );
      default:
        return (
          <div
            {...editableProps}
            contentEditable={!readOnly}
            className="text-sm text-text leading-relaxed outline-none min-h-[1.5em]"
            dangerouslySetInnerHTML={{ __html: block.content || "" }}
          />
        );
    }
  };

  if (block.type === "divider") {
    return (
      <div ref={setNodeRef} style={style} className={cn("py-2", isDragging && "opacity-50")}>
        {renderContent()}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex gap-2 py-1.5 rounded-lg transition-colors",
        isDragging && "opacity-60 bg-gold/5",
        !readOnly && "hover:bg-surface2/40"
      )}
    >
      {!readOnly && (
        <button
          type="button"
          className="opacity-0 group-hover:opacity-60 shrink-0 pt-1 cursor-grab"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-text3" />
        </button>
      )}
      <div className="flex-1 min-w-0">{renderContent()}</div>
    </div>
  );
}

function ImageBlock({
  block,
  readOnly,
  onChange,
  onUpload,
}: {
  block: JournalBlock;
  readOnly?: boolean;
  onChange: (b: JournalBlock) => void;
  onUpload?: (f: File, id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const url = block.metadata?.url as string | undefined;
  const fullWidth = Boolean(block.metadata?.fullWidth);

  return (
    <div className={cn("space-y-2", fullWidth && "w-full")}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={block.metadata?.caption as string ?? ""}
          className={cn(
            "rounded-xl border border-border2 object-cover",
            fullWidth ? "w-full max-h-[420px]" : "max-w-md max-h-64"
          )}
        />
      ) : (
        <div
          className="border border-dashed border-border2 rounded-xl p-8 text-center text-text3 text-sm cursor-pointer hover:border-gold/40"
          onClick={() => !readOnly && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f && onUpload) onUpload(f, block.id);
          }}
        >
          اسحب صورة أو انقر للرفع
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && onUpload) onUpload(f, block.id);
        }}
      />
      <input
        className="w-full bg-transparent text-xs text-text3 outline-none"
        placeholder="تعليق على الصورة…"
        value={(block.metadata?.caption as string) ?? ""}
        readOnly={readOnly}
        onChange={(e) =>
          onChange({
            ...block,
            metadata: { ...block.metadata, caption: e.target.value },
          })
        }
      />
    </div>
  );
}
