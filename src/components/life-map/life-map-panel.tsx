"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { LifeMapNode, LifeMapEdge } from "@/lib/life-map/types";

const TYPE_LABELS: Record<string, string> = {
  center: "المركز",
  area: "مجال",
  vision: "رؤية",
  goal: "هدف",
  project: "مشروع",
  task: "مهمة",
  habit: "عادة",
  book: "كتاب",
  skill: "مهارة",
  course: "دورة",
  cert: "شهادة",
  resource: "مورد",
  learning_path: "مسار تعلم",
  weight: "وزن",
  finance: "مالية",
};

interface LifeMapPanelProps {
  node: LifeMapNode | null;
  nodes: LifeMapNode[];
  edges: LifeMapEdge[];
  onSelectNode: (n: LifeMapNode) => void;
  onClose: () => void;
}

export function LifeMapPanel({ node, nodes, edges, onSelectNode, onClose }: LifeMapPanelProps) {
  if (!node) return null;

  const related = edges
    .filter((e) => e.from === node.id || e.to === node.id)
    .map((e) => {
      const otherId = e.from === node.id ? e.to : e.from;
      return nodes.find((n) => n.id === otherId);
    })
    .filter(Boolean) as LifeMapNode[];

  const tasks = related.filter((n) => n.type === "task");
  const habits = related.filter((n) => n.type === "habit");
  const projects = related.filter((n) => n.type === "project");
  const books = related.filter((n) => n.type === "book");
  const learning = related.filter((n) => ["course", "cert", "skill", "learning_path"].includes(n.type));

  return (
    <AnimatePresence>
      <motion.aside
        key={node.id}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ type: "spring", stiffness: 400, damping: 34 }}
        className="absolute top-0 left-0 z-20 w-full sm:w-[340px] h-full border-r border-border/60 glass-premium overflow-y-auto"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-2xl">{node.icon}</span>
              <h2 className="font-bold text-lg mt-1">{node.label}</h2>
              <p className="text-xs text-text3">{TYPE_LABELS[node.type] ?? node.type}</p>
            </div>
            <button type="button" onClick={onClose} className="text-text3 hover:text-text text-xl leading-none p-1">×</button>
          </div>

          {node.description && <p className="text-sm text-text2 leading-relaxed">{node.description}</p>}

          {node.progress != null && (
            <div className="p-3 rounded-xl bg-surface2/80 border border-border/40">
              <div className="text-xs text-text3 mb-1">التقدم</div>
              <div className="text-2xl font-black text-gold2">{node.progress}%</div>
              <div className="h-1.5 bg-surface3 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${node.progress}%` }} />
              </div>
            </div>
          )}

          {node.healthScore != null && (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-surface2/60 border border-border/30">
                <div className="text-[10px] text-text3">Health</div>
                <div className="font-bold text-emerald2">{node.healthScore}%</div>
              </div>
              <div className="p-2 rounded-lg bg-surface2/60 border border-border/30">
                <div className="text-[10px] text-text3">Risk</div>
                <div className="font-bold capitalize">{node.riskLevel ?? "—"}</div>
              </div>
            </div>
          )}

          {node.status === "at_risk" && (
            <div className="text-xs px-3 py-2 rounded-lg bg-rose/10 border border-rose/30 text-rose2">
              ⚠ يحتاج انتباه — التقدم أو الالتزام منخفض
            </div>
          )}

          {tasks.length > 0 && (
            <Section title="مهام مرتبطة" items={tasks} onSelect={onSelectNode} />
          )}
          {habits.length > 0 && (
            <Section title="عادات مرتبطة" items={habits} onSelect={onSelectNode} />
          )}
          {projects.length > 0 && (
            <Section title="مشاريع" items={projects} onSelect={onSelectNode} />
          )}
          {books.length > 0 && (
            <Section title="كتب" items={books} onSelect={onSelectNode} />
          )}
          {learning.length > 0 && (
            <Section title="تعلم" items={learning} onSelect={onSelectNode} />
          )}

          {related.length > 0 && !tasks.length && !habits.length && (
            <Section title="مرتبط بـ" items={related.slice(0, 8)} onSelect={onSelectNode} />
          )}

          {node.href && (
            <Button variant="gold" className="w-full" onClick={() => { window.location.href = node.href!; }}>
              فتح في النظام →
            </Button>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

function Section({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: LifeMapNode[];
  onSelect: (n: LifeMapNode) => void;
}) {
  return (
    <div>
      <div className="text-xs font-bold text-text3 mb-2">{title}</div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="w-full text-right text-sm px-2 py-1.5 rounded-lg hover:bg-surface2/80 flex items-center gap-2 transition-colors"
            >
              <span>{item.icon}</span>
              <span className="truncate flex-1">{item.label}</span>
              {item.progress != null && <span className="text-[10px] font-mono text-text3">{item.progress}%</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
