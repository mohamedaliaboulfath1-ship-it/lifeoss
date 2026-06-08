"use client";

import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { GoalDrillDown } from "@/types/areas";

interface Props {
  data: GoalDrillDown;
  onClose: () => void;
}

export function GoalDrillDownPanel({ data, onClose }: Props) {
  const g = data.goal;
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold text-lg text-gold2">{g.title}</h2>
            <div className="text-sm text-text3">Progress: {g.progress}% · {g.completion?.successProbability ?? "—"}% احتمال</div>
          </div>
          <button type="button" className="text-text3 hover:text-text" onClick={onClose}>✕</button>
        </div>

        <ProgressBar value={g.progress} color="var(--gold)" className="h-2" />
        {data.forecast && <p className="text-xs text-gold2">{data.forecast}</p>}

        <Section title="📁 Projects" items={data.projects.map((p) => `${p.title} (${p.progress}%)`)} />
        <Section title="📋 Tasks" items={data.tasks.map((t) => `${t.title} · ${t.status}`)} />
        <Section title="✅ Habits" items={data.habits.map((h) => `${h.name} · ${h.adherencePct}%`)} />
        <Section title="📊 Metrics" items={data.metrics.map((m) => `${m.label}: ${m.value}`)} />
      </Card>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="text-sm font-bold mb-2">{title}</div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm p-2 rounded-sm bg-surface2/60 border border-border/40">{item}</li>
        ))}
      </ul>
    </div>
  );
}
