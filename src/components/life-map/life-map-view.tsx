"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LifeMapHubSidebar } from "./life-map-hub-sidebar";
import { LifeMapPanel } from "./life-map-panel";
import type { LifeMapCanvasHandle } from "./life-map-canvas";
import type { LifeMapNode, LifeMapPayload } from "@/lib/life-map/types";
import {
  enrichHubCounts,
  getBranchGraph,
  getFullGraph,
  getHubList,
  getOverviewGraph,
} from "@/lib/life-map/filter-graph";
import type { LayoutMode } from "@/lib/life-map/layout";

const LifeMapCanvas = dynamic(
  () => import("./life-map-canvas").then((m) => m.LifeMapCanvas),
  {
    ssr: false,
    loading: () => <div className="flex-1 skeleton-shimmer min-h-[320px]" />,
  }
);

type ViewMode = "overview" | "branch" | "full";

export function LifeMapView() {
  const [data, setData] = useState<LifeMapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LifeMapNode | null>(null);
  const [activeHub, setActiveHub] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const canvasRef = useRef<LifeMapCanvasHandle | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/life-map");
    const json = await res.json().catch(() => null);
    if (json?.nodes) setData(enrichHubCounts(json as LifeMapPayload));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const hubList = useMemo(() => (data ? getHubList(data) : []), [data]);

  const visibleGraph = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    if (viewMode === "full") return getFullGraph(data);
    if (viewMode === "branch" && activeHub) return getBranchGraph(data, activeHub);
    return getOverviewGraph(data);
  }, [data, viewMode, activeHub]);

  const layoutMode: LayoutMode =
    viewMode === "overview" ? "overview" : viewMode === "branch" ? "branch" : "full";

  const searchResults = useMemo(() => {
    if (!data || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return data.nodes
      .filter((n) => n.type !== "center" && n.type !== "area")
      .filter((n) => n.label.toLowerCase().includes(q))
      .slice(0, 6);
  }, [data, query]);

  function focusNode(node: LifeMapNode) {
    if (node.hubId && viewMode === "overview") {
      setActiveHub(node.hubId);
      setViewMode("branch");
    }
    setSelected(node);
    setShowPanel(true);
    setFocusId(node.id);
    window.setTimeout(() => setFocusId(null), 600);
  }

  function openHub(hubId: string) {
    setActiveHub(hubId);
    setViewMode("branch");
    setSelected(null);
    setShowPanel(false);
  }

  function backToOverview() {
    setActiveHub(null);
    setViewMode("overview");
    setSelected(null);
    setShowPanel(false);
  }

  const activeHubLabel = hubList.find((h) => h.id === activeHub)?.label;

  if (loading && !data) {
    return <div className="h-80 skeleton-shimmer rounded-2xl" />;
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-text3">
        تعذّر التحميل —{" "}
        <button type="button" className="text-gold2 underline" onClick={() => void load()}>إعادة</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-xl font-black text-gold2">خريطة الحياة</h1>
          <p className="text-[10px] text-text3">
            {viewMode === "overview" && "اختر مجالاً للتوسع"}
            {viewMode === "branch" && activeHubLabel && `عرض: ${activeHubLabel}`}
            {viewMode === "full" && "الخريطة الكاملة (محدودة)"}
          </p>
        </div>

        <div className="flex-1 min-w-[180px] max-w-sm relative">
          <Input
            placeholder="🔍 ابحث..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-sm h-9"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-surface border border-border rounded-xl shadow-lg z-50">
              {searchResults.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { setQuery(""); focusNode(n); }}
                  className="w-full text-right px-3 py-2 text-sm hover:bg-surface2 flex gap-2"
                >
                  <span>{n.icon}</span>
                  <span className="truncate">{n.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {viewMode !== "overview" && (
            <Button variant="ghost" size="sm" onClick={backToOverview}>← عام</Button>
          )}
          {viewMode !== "full" && (
            <Button variant="ghost" size="sm" onClick={() => { setViewMode("full"); setActiveHub(null); }}>
              خريطة كاملة
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => canvasRef.current?.fitView()}>⊞</Button>
          <Button variant="ghost" size="sm" onClick={() => void load()}>↻</Button>
        </div>
      </div>

      {/* Split: sidebar + canvas */}
      <div className="flex flex-col lg:flex-row-reverse rounded-2xl border border-border/50 overflow-hidden bg-surface/30 min-h-[420px] max-h-[72vh]">
        <LifeMapHubSidebar
          hubs={hubList}
          activeHubId={viewMode === "branch" ? activeHub : null}
          onSelectHub={(id) => (id ? openHub(id) : backToOverview())}
        />

        <div className="relative flex-1 min-h-[320px] min-w-0">
          <LifeMapCanvas
            nodes={visibleGraph.nodes}
            edges={visibleGraph.edges}
            layoutMode={layoutMode}
            selectedId={selected?.id ?? null}
            focusId={focusId}
            onSelect={(n) => {
              setSelected(n);
              setShowPanel(!!n && n.type !== "area" && n.type !== "center");
            }}
            onHubOpen={openHub}
            canvasRef={canvasRef}
          />

          {viewMode === "overview" && (
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-text3 bg-surface/80 px-3 py-1 rounded-full border border-border/40 pointer-events-none">
              اضغط على مجال لفتح تفاصيله
            </p>
          )}

          {showPanel && selected && selected.type !== "area" && selected.type !== "center" && (
            <div className="absolute inset-y-0 left-0 z-20 w-full sm:w-[300px] shadow-premium-lg">
              <LifeMapPanel
                node={selected}
                nodes={data.nodes}
                edges={data.edges}
                onSelectNode={focusNode}
                onClose={() => { setShowPanel(false); setSelected(null); }}
              />
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-text3 text-center">
        {visibleGraph.nodes.length} عقدة معروضة
        {viewMode === "full" && data.nodes.length > 120 && ` من ${data.nodes.length}`}
      </p>
    </div>
  );
}
