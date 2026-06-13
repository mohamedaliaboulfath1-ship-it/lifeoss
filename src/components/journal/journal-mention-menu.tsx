"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MentionResult } from "@/types/journal";

interface MentionMenuProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (mention: MentionResult) => void;
  onClose: () => void;
}

export function JournalMentionMenu({ query, position, onSelect, onClose }: MentionMenuProps) {
  const [results, setResults] = useState<MentionResult[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/journal/mentions?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setResults(json.results ?? []);
          setIndex(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[index]) {
        e.preventDefault();
        onSelect(results[index]!);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, results, onClose, onSelect]);

  const TYPE_ICON: Record<string, string> = {
    goal: "🎯",
    project: "📁",
    task: "✅",
    book: "📚",
    habit: "🔄",
    area: "🗂️",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed z-[400] w-72 max-h-64 overflow-y-auto rounded-xl border border-border2 bg-surface/95 backdrop-blur-xl shadow-premium-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-2 text-[10px] text-text3 font-mono border-b border-border/60">
        ربط @ — أهداف · مهام · كتب
      </div>
      {loading && <div className="p-3 text-xs text-text3">جاري البحث…</div>}
      {!loading && !results.length && (
        <div className="p-3 text-xs text-text3">لا نتائج</div>
      )}
      {results.map((r, i) => (
        <button
          key={`${r.type}:${r.id}`}
          type="button"
          className={cn(
            "w-full text-right px-3 py-2 flex items-center gap-2 text-sm",
            i === index ? "bg-sky/15 text-sky2" : "hover:bg-surface2"
          )}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(r);
          }}
        >
          <span>{TYPE_ICON[r.type] ?? "🔗"}</span>
          <span className="truncate">{r.label}</span>
        </button>
      ))}
    </motion.div>
  );
}
