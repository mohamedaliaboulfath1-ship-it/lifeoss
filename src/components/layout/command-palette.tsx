"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NAV_PAGES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { modalBackdrop, modalPanel } from "@/lib/motion/modal";
import {
  getFavorites,
  getRecentPages,
  trackPageVisit,
  trackSearchQuery,
} from "@/lib/navigation-store";

type PaletteItem = {
  id: string;
  title: string;
  sub?: string;
  icon?: string;
  href: string;
  kind: "page" | "entity";
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entityResults, setEntityResults] = useState<PaletteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const staticResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = NAV_PAGES.map((p) => ({
      id: p.id,
      title: p.title,
      sub: p.sub,
      icon: p.icon,
      href: p.href,
      kind: "page" as const,
    }));

    if (!q) {
      const recents = getRecentPages().map((r) => ({
        id: `recent-${r.href}`,
        title: r.title,
        sub: "مؤخراً",
        icon: r.icon,
        href: r.href,
        kind: "page" as const,
      }));
      const favs = getFavorites().map((f) => ({
        id: `fav-${f.href}`,
        title: f.title,
        sub: "مفضّل",
        icon: f.icon,
        href: f.href,
        kind: "page" as const,
      }));
      return [...favs, ...recents, ...pages].slice(0, 12);
    }

    return pages
      .filter((p) =>
        [p.title, p.sub, p.id].join(" ").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query]);

  const results = useMemo(() => {
    const merged = [...entityResults, ...staticResults];
    const seen = new Set<string>();
    return merged.filter((r) => {
      const key = `${r.href}-${r.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 14);
  }, [entityResults, staticResults]);

  const go = useCallback(
    (item: PaletteItem) => {
      trackPageVisit(item.href, item.title, item.icon);
      if (query.trim().length >= 2) trackSearchQuery(query);
      router.push(item.href);
      setOpen(false);
      setQuery("");
      setEntityResults([]);
      setActiveIdx(0);
    },
    [router, query]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
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
        go(results[activeIdx]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, activeIdx, go]);

  useEffect(() => {
    setActiveIdx(0);
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) {
      setEntityResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/v1/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((json) => {
          setEntityResults(
            (json.results ?? []).map(
              (r: { id: string; type: string; title: string; subtitle?: string; href: string }) => ({
                id: `${r.type}-${r.id}`,
                title: r.title,
                sub: r.subtitle,
                href: r.href,
                kind: "entity" as const,
              })
            )
          );
        })
        .catch(() => setEntityResults([]))
        .finally(() => setLoading(false));
    }, 220);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...modalBackdrop}
          className="fixed inset-0 z-[220] bg-black/55 backdrop-blur-md flex items-start justify-center p-4 md:p-6"
          onClick={() => setOpen(false)}
        >
          <motion.div
            {...modalPanel}
            className="w-full max-w-2xl bg-surface border border-border2 rounded-[12px] shadow-premium-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="لوحة الأوامر"
          >
            <div className="px-4 pt-4 pb-2 flex items-center justify-between text-[11px] text-text3">
              <span>⌘K · تنقل · بحث · أهداف · مهام</span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface2 border border-border font-mono">ESC</kbd>
            </div>
            <div className="px-4 pb-3">
              <Input
                autoFocus
                placeholder="ابحث عن صفحة أو هدف أو مهمة..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="focus-ring"
                aria-label="بحث سريع"
              />
            </div>
            <div className="max-h-[min(360px,50vh)] overflow-y-auto border-t border-border px-2 py-2 space-y-0.5">
              {loading && (
                <div className="px-3 py-2 text-xs text-text3 skeleton-shimmer rounded-sm mx-1">
                  جاري البحث في بياناتك…
                </div>
              )}
              {results.length === 0 && !loading && (
                <div className="px-3 py-6 text-center text-sm text-text3">لا نتائج</div>
              )}
              {results.map((r, i) => (
                <button
                  type="button"
                  key={r.id}
                  className={`w-full text-right rounded-sm border px-3 py-2.5 transition-all focus-ring ${
                    i === activeIdx
                      ? "border-gold/50 bg-gold/8"
                      : "border-transparent hover:border-border2 hover:bg-surface2"
                  }`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => go(r)}
                >
                  <span className="text-sm flex items-center gap-2">
                    {r.icon && <span>{r.icon}</span>}
                    <span className="font-medium">{r.title}</span>
                    {r.kind === "entity" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface3 text-text3">بيانات</span>
                    )}
                  </span>
                  {r.sub && (
                    <span className="text-[11px] text-text3 block mt-0.5">{r.sub}</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
