"use client";
import { ViewShell } from "@/components/motion/view-shell";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { YearPayload } from "@/types/lifeos";
import type { DashboardSnapshot } from "@/types/lifeos-pro";
import { buildAiInsights, type AiInsight } from "@/lib/ai/engine";

interface AiCoachViewProps {
  yearData: YearPayload;
  dashboard?: DashboardSnapshot | null;
}

export function AiCoachView({ yearData, dashboard }: AiCoachViewProps) {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const insights = useMemo(() => buildAiInsights(yearData, dashboard), [yearData, dashboard]);

  async function askCoach() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      setReply(json.reply ?? "تعذر الرد حالياً.");
    } finally {
      setLoading(false);
    }
  }

  function insightColor(type: AiInsight["type"]) {
    if (type === "risk") return "text-rose2";
    if (type === "opportunity") return "text-emerald";
    return "text-gold2";
  }

  return (
    <ViewShell>
      <Card className="p-5 bg-gradient-to-br from-purple/20 to-transparent border-purple/40">
        <h2 className="font-display text-2xl font-black mb-1">🤖 AI Coach</h2>
        <p className="text-sm text-text3">طبقة ذكاء أولية Rule-Based للرؤى والتوجيه التنفيذي اليومي</p>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="اسأل المدرب: كيف أرفع Career Score هذا الأسبوع؟"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button variant="gold" onClick={askCoach} disabled={loading}>
            {loading ? "..." : "إرسال"}
          </Button>
        </div>
        {reply && <div className="text-sm whitespace-pre-line text-text2 border border-border rounded-sm p-3 bg-surface2/50">{reply}</div>}
      </Card>

      <Card className="p-4 space-y-2">
        <h3 className="font-bold text-gold2">Insights</h3>
        {insights.map((ins) => (
          <div key={ins.id} className="border-b border-border/50 pb-2">
            <div className={`font-semibold text-sm ${insightColor(ins.type)}`}>{ins.title}</div>
            <div className="text-sm text-text2">{ins.message}</div>
          </div>
        ))}
      </Card>
    </ViewShell>
  );
}
