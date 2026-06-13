"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/glass";
import type { JournalAiAction, JournalBlock } from "@/types/journal";

const ACTIONS: { id: JournalAiAction; label: string; icon: string }[] = [
  { id: "summarize", label: "تلخيص", icon: "📋" },
  { id: "rewrite", label: "إعادة صياغة", icon: "✍️" },
  { id: "expand", label: "توسيع", icon: "📖" },
  { id: "translate", label: "ترجمة", icon: "🌐" },
  { id: "extract_tasks", label: "استخراج مهام", icon: "✅" },
  { id: "extract_goals", label: "استخراج أهداف", icon: "🎯" },
  { id: "extract_habits", label: "استخراج عادات", icon: "🔄" },
  { id: "action_plan", label: "خطة عمل", icon: "🗺️" },
];

interface AiPanelProps {
  title: string;
  blocks: JournalBlock[];
  onApplyBlocks?: (blocks: JournalBlock[]) => void;
}

export function JournalAiPanel({ title, blocks, onApplyBlocks }: AiPanelProps) {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(action: JournalAiAction) {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/journal/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, title, blocks }),
      });
      const json = await res.json();
      setResult(json.result ?? "—");
      if (json.blocks?.length && onApplyBlocks) {
        onApplyBlocks(json.blocks);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassPanel className="p-4 space-y-3">
      <div className="text-sm font-bold text-gold2">🤖 أدوات الذكاء</div>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <Button
            key={a.id}
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={() => run(a.id)}
          >
            {a.icon} {a.label}
          </Button>
        ))}
      </div>
      {loading && <p className="text-xs text-text3 animate-pulse">جاري المعالجة…</p>}
      {result && (
        <pre className="text-xs text-text2 whitespace-pre-wrap bg-surface2/60 rounded-lg p-3 border border-border/60 max-h-48 overflow-y-auto">
          {result}
        </pre>
      )}
    </GlassPanel>
  );
}
