"use client";

import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function renderMarkdownLite(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="text-sm font-bold text-gold2 mt-2 mb-1">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.startsWith("> ")) {
      return (
        <blockquote key={i} className="border-r-2 border-gold/40 pr-3 text-text3 italic text-sm my-1">
          {line.slice(2)}
        </blockquote>
      );
    }
    if (line.startsWith("- [ ] ")) {
      return (
        <label key={i} className="flex items-center gap-2 text-sm my-0.5">
          <input type="checkbox" readOnly className="rounded" />
          {line.slice(6)}
        </label>
      );
    }
    if (line.startsWith("- [x] ")) {
      return (
        <label key={i} className="flex items-center gap-2 text-sm my-0.5 text-text3 line-through">
          <input type="checkbox" readOnly checked className="rounded" />
          {line.slice(6)}
        </label>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={i} className="text-sm mr-4 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    if (!line.trim()) return <br key={i} />;
    return (
      <p key={i} className="text-sm my-0.5">
        {line}
      </p>
    );
  });
}

export function BookNotesEditor({
  value,
  onChange,
  saving,
  lastSaved,
}: {
  value: string;
  onChange: (v: string) => void;
  saving?: boolean;
  lastSaved?: string | null;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const insert = useCallback(
    (prefix: string) => {
      const el = ref.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const before = value.slice(0, start);
      const after = value.slice(end);
      const lineStart = before.lastIndexOf("\n") + 1;
      const needsNewline = lineStart > 0 && before.length > 0;
      const next = `${before}${needsNewline ? "\n" : ""}${prefix}${after}`;
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + prefix.length + (needsNewline ? 1 : 0);
        el.setSelectionRange(pos, pos);
      });
    },
    [onChange, value]
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {[
          { label: "عنوان", prefix: "## " },
          { label: "قائمة", prefix: "- " },
          { label: "مهمة", prefix: "- [ ] " },
          { label: "اقتباس", prefix: "> " },
        ].map((t) => (
          <Button key={t.label} type="button" variant="ghost" size="sm" onClick={() => insert(t.prefix)}>
            {t.label}
          </Button>
        ))}
        <span className="text-[10px] text-text3 self-center mr-auto">
          {saving ? "جاري الحفظ..." : lastSaved ? `آخر حفظ: ${lastSaved}` : "يُحفظ تلقائياً"}
        </span>
      </div>
      <textarea
        ref={ref}
        className="w-full bg-surface2/80 border border-border rounded-lg px-3 py-2 text-sm min-h-[120px] font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ملاحظات القراءة — عناوين، قوائم، مهام، اقتباسات..."
      />
      {value.trim() && (
        <div className={cn("rounded-lg border border-border/50 p-3 bg-surface2/30 max-h-40 overflow-y-auto")}>
          <div className="text-[10px] text-text3 mb-2">معاينة</div>
          {renderMarkdownLite(value)}
        </div>
      )}
    </div>
  );
}
