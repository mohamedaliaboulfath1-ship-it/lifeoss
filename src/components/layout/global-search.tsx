"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { dropdownPanel } from "@/lib/motion/modal";
import { getRecentSearches, trackSearchQuery } from "@/lib/navigation-store";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
}

const TYPE_LABELS: Record<string, string> = {
  goal: "هدف",
  habit: "عادة",
  task: "مهمة",
  book: "كتاب",
  finance: "مالية",
  cert: "شهادة",
  course: "دورة",
};

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/v1/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((json) => setResults(json.results ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(query), 280);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, search]);

  useEffect(() => {
    setActiveIdx(0);
  }, [results, query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(r: SearchResult) {
    trackSearchQuery(query || r.title);
    router.push(r.href);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function pickRecent(q: string) {
    setQuery(q);
    setOpen(true);
  }

  const showDropdown =
    open &&
    (results.length > 0 ||
      loading ||
      (query.length < 2 && recents.length > 0) ||
      query.length >= 2);

  return (
    <div ref={rootRef} className="relative w-full max-w-xs hidden sm:block">
      <div className="relative">
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text3 pointer-events-none" />
        <Input
          placeholder="بحث شامل..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setRecents(getRecentSearches());
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, results.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, 0));
            }
            if (e.key === "Enter" && results[activeIdx]) {
              e.preventDefault();
              pick(results[activeIdx]);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          className="h-8 text-xs pr-8 focus-ring"
          aria-label="بحث شامل"
          aria-expanded={showDropdown}
        />
      </div>
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            {...dropdownPanel}
            className="absolute top-10 inset-x-0 bg-surface border border-border rounded-sm z-[205] overflow-hidden shadow-premium-lg"
            role="listbox"
          >
            {loading && (
              <div className="px-3 py-2 text-xs text-text3">جاري البحث...</div>
            )}
            {query.length < 2 && recents.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] text-text3 uppercase tracking-wide">
                  عمليات بحث سابقة
                </div>
                {recents.map((q) => (
                  <button
                    type="button"
                    key={q}
                    className="w-full text-right px-3 py-2 text-xs hover:bg-surface2 text-text2"
                    onClick={() => pickRecent(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {results.map((r, i) => (
              <button
                type="button"
                key={`${r.type}-${r.id}`}
                role="option"
                aria-selected={i === activeIdx}
                className={`w-full text-right px-3 py-2 text-xs border-b border-border/50 flex justify-between gap-2 focus-ring ${
                  i === activeIdx ? "bg-gold/8" : "hover:bg-surface2"
                }`}
                onClick={() => pick(r)}
              >
                <span className="truncate">{r.title}</span>
                <span className="text-text3 shrink-0">
                  {TYPE_LABELS[r.type] ?? r.type}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
