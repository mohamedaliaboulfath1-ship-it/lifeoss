"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LifeMapCanvas, type LifeMapCanvasHandle } from "./life-map-canvas";
import { LifeMapPanel } from "./life-map-panel";
import type { LifeMapNode, LifeMapPayload } from "@/lib/life-map/types";
import { PageUnfold } from "@/components/motion/unfold-reveal";

export function LifeMapView() {
  const [data, setData] = useState<LifeMapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LifeMapNode | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const canvasRef = useRef<LifeMapCanvasHandle | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/life-map");
    const json = await res.json().catch(() => null);
    if (json?.nodes) setData(json as LifeMapPayload);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const searchResults = useMemo(() => {
    if (!data || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return data.nodes.filter((n) => n.label.toLowerCase().includes(q) || n.type.includes(q)).slice(0, 8);
  }, [data, query]);

  function focusNode(node: LifeMapNode) {
    setSelected(node);
    setFocusId(node.id);
    window.setTimeout(() => setFocusId(null), 800);
  }

  if (loading && !data) {
    return <div className="h-[calc(100vh-120px)] skeleton-shimmer rounded-2xl" />;
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-text3">
        تعذّر تحميل خريطة الحياة —{" "}
        <button type="button" className="text-gold2 underline" onClick={() => void load()}>إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <PageUnfold className="flex flex-col h-[calc(100vh-88px)] min-h-[600px] -mx-4 md:-mx-6">
      {/* Toolbar */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3 px-4 md:px-6 py-3 border-b border-border/40 glass-premium shrink-0 z-10"
      >
        <div>
          <h1 className="font-display text-xl font-black text-gold2">خريطة الحياة</h1>
          <p className="text-[10px] text-text3 font-mono">Life Map V2 — Neural Life OS</p>
        </div>

        <div className="flex-1 min-w-[200px] max-w-md relative">
          <Input
            placeholder="🔍 ابحث: FMVA، جيم، صندوق طوارئ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-sm"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-surface border border-border rounded-xl shadow-premium-lg z-50 overflow-hidden">
              {searchResults.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { setQuery(""); focusNode(n); }}
                  className="w-full text-right px-3 py-2 text-sm hover:bg-surface2 flex items-center gap-2"
                >
                  <span>{n.icon}</span>
                  <span className="truncate">{n.label}</span>
                  <span className="text-[10px] text-text3 mr-auto">{n.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => canvasRef.current?.fitView()}>
            ⊞ ملاءمة
          </Button>
          <Button variant="ghost" size="sm" onClick={() => canvasRef.current?.resetView()}>
            ⟲ إعادة
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void load()}>
            ↻ تحديث
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {[
            { label: "أهداف", v: data.stats.goals },
            { label: "مشاريع", v: data.stats.projects },
            { label: "عادات", v: data.stats.habits },
            { label: "مهام", v: data.stats.tasks },
            { label: "كتب", v: data.stats.books },
          ].map((s) => (
            <span key={s.label} className="px-2 py-1 rounded-full bg-surface2 border border-border/40">
              {s.label} <b className="text-gold2">{s.v}</b>
            </span>
          ))}
        </div>
      </motion.header>

      {/* Infinite canvas */}
      <div className="relative flex-1 min-h-0">
        <LifeMapCanvas
          data={data}
          selectedId={selected?.id ?? null}
          hoveredId={hoveredId}
          focusId={focusId}
          onSelect={setSelected}
          onHover={setHoveredId}
          canvasRef={canvasRef}
        />

        {selected && (
          <LifeMapPanel
            node={selected}
            nodes={data.nodes}
            edges={data.edges}
            onSelectNode={focusNode}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </PageUnfold>
  );
}
