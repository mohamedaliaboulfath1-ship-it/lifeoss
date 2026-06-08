"use client";

import type { KnowledgeGraphEdge, KnowledgeGraphNode } from "@/types/areas";

const TYPE_COLORS: Record<string, string> = {
  goal: "var(--gold)",
  project: "var(--sky)",
  task: "var(--amber2)",
  habit: "var(--emerald)",
  book: "var(--purple)",
  course: "var(--teal)",
  cert: "var(--coral)",
  skill: "var(--pink)",
};

interface Props {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

export function AreaKnowledgeGraph({ nodes, edges }: Props) {
  if (!nodes.length) {
    return <p className="text-text3 text-sm text-center py-4">أضف أهدافاً لرؤية العلاقات</p>;
  }

  const layers: KnowledgeGraphNode[][] = [];
  const goalNodes = nodes.filter((n) => n.type === "goal");
  const childTypes = ["project", "cert", "course", "book", "habit", "task"] as const;

  for (const g of goalNodes) {
    layers.push([g]);
    const children = nodes.filter((n) => edges.some((e) => e.from === g.id && e.to === n.id));
    if (children.length) layers.push(children);
  }

  return (
    <div className="space-y-4 overflow-x-auto py-2">
      {layers.map((layer, li) => (
        <div key={li} className="flex flex-col items-center gap-2">
          {li > 0 && <div className="text-text3 text-lg">↓</div>}
          <div className="flex flex-wrap justify-center gap-3">
            {layer.map((n) => (
              <div
                key={n.id}
                className="px-3 py-2 rounded-sm border text-xs text-center min-w-[100px] max-w-[160px]"
                style={{ borderColor: `${TYPE_COLORS[n.type] ?? "var(--border)"}60`, background: `${TYPE_COLORS[n.type] ?? "var(--border)"}10` }}
              >
                <div className="font-medium truncate">{n.label}</div>
                <div className="text-[10px] text-text3 capitalize">{n.type}</div>
                {n.progress != null && (
                  <div className="text-[10px] font-mono text-gold2 mt-0.5">{n.progress}%</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
