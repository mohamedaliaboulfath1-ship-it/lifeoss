"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text3 pointer-events-none" />
        <Input
          placeholder="بحث شامل..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 text-xs pr-8"
        />
      </div>
      <AnimatePresence>
        {(results.length > 0 || (loading && query.length >= 2)) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-10 inset-x-0 bg-surface border border-border rounded-sm z-[205] overflow-hidden shadow-xl"
          >
            {loading && (
              <div className="px-3 py-2 text-xs text-text3">جاري البحث...</div>
            )}
            {results.map((r) => (
              <button
                type="button"
                key={`${r.type}-${r.id}`}
                className="w-full text-right px-3 py-2 text-xs hover:bg-surface2 border-b border-border/50 flex justify-between gap-2"
                onClick={() => {
                  router.push(r.href);
                  setQuery("");
                  setResults([]);
                }}
              >
                <span className="truncate">{r.title}</span>
                <span className="text-text3 shrink-0">{TYPE_LABELS[r.type] ?? r.type}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
