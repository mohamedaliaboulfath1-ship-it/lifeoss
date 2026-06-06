"use client";

import { useEffect, useMemo, useState } from "react";
import { NAV_PAGES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_PAGES.slice(0, 10);
    return NAV_PAGES.filter((p) =>
      [p.title, p.sub, p.id].join(" ").toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220] bg-black/65 flex items-start justify-center p-6">
      <div className="w-full max-w-2xl bg-surface border border-border2 rounded-[10px] p-4 space-y-3">
        <div className="text-xs text-text3">⌘K / Ctrl+K للبحث والتنقل السريع</div>
        <Input
          autoFocus
          placeholder="ابحث عن صفحة..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="max-h-[360px] overflow-y-auto space-y-1">
          {results.map((r) => (
            <button
              type="button"
              key={r.id}
              className="w-full text-right rounded-sm border border-border/70 px-3 py-2 hover:border-gold/40 hover:bg-surface2"
              onClick={() => {
                router.push(r.href);
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="text-sm">{r.icon} {r.title}</span>
              <span className="text-[11px] text-text3 block">{r.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
