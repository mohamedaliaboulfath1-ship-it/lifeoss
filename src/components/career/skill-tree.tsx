"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MOTION } from "@/lib/motion/transitions";

export interface SkillNode {
  id: string;
  name: string;
  currentPct: number;
  targetPct: number;
  category?: string;
  linkedCourses?: number;
  linkedCerts?: number;
}

const FA_SKILL_TREE: { name: string; category: string; targetPct: number }[] = [
  { name: "Accounting", category: "foundation", targetPct: 80 },
  { name: "Excel", category: "foundation", targetPct: 90 },
  { name: "Financial Modeling", category: "core", targetPct: 85 },
  { name: "Valuation", category: "core", targetPct: 80 },
  { name: "Power BI", category: "analytics", targetPct: 75 },
  { name: "SQL", category: "analytics", targetPct: 70 },
  { name: "Data Analysis", category: "analytics", targetPct: 75 },
  { name: "FP&A", category: "advanced", targetPct: 80 },
];

interface SkillTreeProps {
  skills: SkillNode[];
  readinessScore?: number;
  promotionScore?: number;
}

export function SkillTree({ skills, readinessScore, promotionScore }: SkillTreeProps) {
  const nodes = useMemo(() => {
    if (skills.length >= 4) return skills;
    return FA_SKILL_TREE.map((s, i) => {
      const match = skills.find((sk) => sk.name.toLowerCase().includes(s.name.toLowerCase().slice(0, 4)));
      return {
        id: match?.id ?? `skill-${i}`,
        name: s.name,
        currentPct: match?.currentPct ?? 0,
        targetPct: s.targetPct,
        category: s.category,
        linkedCourses: match?.linkedCourses ?? 0,
        linkedCerts: match?.linkedCerts ?? 0,
      };
    });
  }, [skills]);

  const gaps = useMemo(
    () =>
      nodes
        .map((n) => ({ ...n, gap: Math.max(0, n.targetPct - n.currentPct) }))
        .filter((n) => n.gap > 15)
        .sort((a, b) => b.gap - a.gap),
    [nodes]
  );

  const categories = ["foundation", "core", "analytics", "advanced"] as const;
  const catLabels: Record<string, string> = {
    foundation: "أساسيات",
    core: "جوهرية",
    analytics: "تحليلات",
    advanced: "متقدمة",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 gradient-indigo text-center">
          <div className="text-[10px] text-text3">Career Readiness</div>
          <div className="text-2xl font-black">{readinessScore ?? 0}%</div>
        </Card>
        <Card className="p-4 gradient-purple text-center">
          <div className="text-[10px] text-text3">Promotion Readiness</div>
          <div className="text-2xl font-black">{promotionScore ?? Math.round((readinessScore ?? 0) * 0.85)}%</div>
        </Card>
      </div>

      {categories.map((cat) => {
        const catNodes = nodes.filter((n) => n.category === cat);
        if (!catNodes.length) return null;
        return (
          <div key={cat}>
            <div className="text-xs font-bold text-gold2 mb-2">{catLabels[cat]}</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {catNodes.map((node, i) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...MOTION.spring, delay: i * 0.05 }}
                >
                  <Card className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{node.name}</span>
                      <span className="text-text3 font-mono">{node.currentPct}%</span>
                    </div>
                    <ProgressBar value={node.currentPct} color="var(--sky)" className="h-1.5" />
                    <div className="text-[10px] text-text3 mt-1">هدف: {node.targetPct}%</div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}

      {gaps.length > 0 && (
        <Card className="p-4 border-rose/30 bg-rose/5">
          <div className="text-sm font-bold text-rose2 mb-2">Skill Gap Analysis</div>
          {gaps.slice(0, 4).map((g) => (
            <div key={g.id} className="text-xs text-text2 py-1 border-b border-border/30 last:border-0">
              {g.name}: فجوة {g.gap}% — ابدأ بدورة أو مشروع
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
