"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NAV_PAGES } from "@/lib/constants";
import { Input } from "@/components/ui/input";

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return NAV_PAGES.filter((p) =>
      `${p.title} ${p.sub} ${p.id}`.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [query]);

  return (
    <div className="relative w-full max-w-xs">
      <Input
        placeholder="بحث شامل..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 text-xs"
      />
      {results.length > 0 && (
        <div className="absolute top-10 inset-x-0 bg-surface border border-border rounded-sm z-[205] overflow-hidden">
          {results.map((r) => (
            <button
              type="button"
              key={r.id}
              className="w-full text-right px-3 py-2 text-xs hover:bg-surface2 border-b border-border/50"
              onClick={() => {
                router.push(r.href);
                setQuery("");
              }}
            >
              {r.icon} {r.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
