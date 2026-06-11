"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { buildAreaIntelligence } from "@/lib/areas/intelligence";
import { MOTION } from "@/lib/motion/transitions";
import type { AreaHubPayload } from "@/types/areas";

interface AreaIntelligencePanelProps {
  hub: AreaHubPayload;
}

export function AreaIntelligencePanel({ hub }: AreaIntelligencePanelProps) {
  const intel = useMemo(() => {
    const habitsBelow50 = hub.habits
      .filter((h) => h.adherencePct < 50)
      .map((h) => h.name);
    return buildAreaIntelligence({
      areaSlug: hub.area.slug,
      areaName: hub.area.nameAr,
      healthScore: hub.healthScore,
      goalsAtRisk: hub.goals.filter((g) => g.completion?.atRisk).length,
      habitsBelow50,
      tasksOverdue: hub.tasksOverdue.length,
      trajectory: hub.healthScore >= 70 ? "up" : hub.healthScore < 45 ? "down" : "flat",
    });
  }, [hub]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOTION.spring}
      className="space-y-3"
    >
      <Card className="p-4 gradient-indigo">
        <div className="text-xs text-text3">المسار</div>
        <div className="text-lg font-bold">{intel.trajectory}</div>
        <div className="text-2xl font-black text-gold2 mt-1">{hub.healthScore}%</div>
      </Card>

      {intel.risks.length > 0 && (
        <Card className="p-4 space-y-2 border-rose/30">
          <div className="text-xs font-bold text-rose2">مخاطر</div>
          {intel.risks.map((r) => (
            <div key={r.id} className="text-sm p-2 rounded-sm bg-rose/5 border border-rose/20">
              {r.icon} {r.message}
            </div>
          ))}
        </Card>
      )}

      {intel.recommendations.length > 0 && (
        <Card className="p-4 space-y-2">
          <div className="text-xs font-bold text-gold2">توصيات</div>
          {intel.recommendations.map((r) => (
            <div key={r.id} className="text-sm p-2 rounded-sm bg-surface2 border border-border/40">
              {r.icon} {r.message}
            </div>
          ))}
        </Card>
      )}

      {intel.opportunities.length > 0 && (
        <Card className="p-4 space-y-2 border-emerald/30">
          <div className="text-xs font-bold text-emerald">فرص</div>
          {intel.opportunities.map((r) => (
            <div key={r.id} className="text-sm">{r.icon} {r.message}</div>
          ))}
        </Card>
      )}
    </motion.div>
  );
}
