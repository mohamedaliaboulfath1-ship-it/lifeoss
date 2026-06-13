"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { filterSlashCommands } from "@/lib/journal/blocks";
import type { JournalBlockType } from "@/types/journal";
import { motion, AnimatePresence } from "framer-motion";

interface SlashMenuProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (type: JournalBlockType) => void;
  onClose: () => void;
}

export function JournalSlashMenu({ query, position, onSelect, onClose }: SlashMenuProps) {
  const [index, setIndex] = useState(0);
  const items = filterSlashCommands(query);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setIndex(0), [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, items.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && items[index]) {
        e.preventDefault();
        onSelect(items[index]!.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items, onClose, onSelect]);

  if (!items.length) return null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="fixed z-[400] w-64 max-h-72 overflow-y-auto rounded-xl border border-border2 bg-surface/95 backdrop-blur-xl shadow-premium-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-2 text-[10px] text-text3 font-mono border-b border-border/60">
        أوامر /
      </div>
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            "w-full text-right px-3 py-2 flex items-center gap-3 text-sm transition-colors",
            i === index ? "bg-gold/15 text-gold2" : "hover:bg-surface2"
          )}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item.id);
          }}
        >
          <span className="w-8 text-center font-mono text-xs opacity-70">{item.icon}</span>
          <span>{item.label}</span>
          <span className="text-[10px] text-text3 mr-auto">/{item.id}</span>
        </button>
      ))}
    </motion.div>
  );
}
