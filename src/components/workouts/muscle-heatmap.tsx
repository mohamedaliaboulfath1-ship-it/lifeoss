"use client";

import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion/transitions";

const MUSCLE_REGIONS: { id: string; label: string; cx: number; cy: number; r: number }[] = [
  { id: "صدر", label: "صدر", cx: 100, cy: 72, r: 22 },
  { id: "ظهر", label: "ظهر", cx: 100, cy: 78, r: 24 },
  { id: "كتف", label: "كتف", cx: 68, cy: 62, r: 14 },
  { id: "أكتاف", label: "أكتاف", cx: 68, cy: 62, r: 14 },
  { id: "ذراع", label: "ذراع", cx: 52, cy: 95, r: 12 },
  { id: "بايسبس", label: "بايسبس", cx: 52, cy: 95, r: 12 },
  { id: "ترايسبس", label: "ترايسبس", cx: 148, cy: 95, r: 12 },
  { id: "بطن", label: "بطن", cx: 100, cy: 108, r: 18 },
  { id: "core", label: "كور", cx: 100, cy: 108, r: 18 },
  { id: "ساق", label: "ساق", cx: 82, cy: 168, r: 16 },
  { id: "فخذ", label: "فخذ", cx: 82, cy: 148, r: 18 },
  { id: "أرجل", label: "أرجل", cx: 82, cy: 168, r: 16 },
  { id: "جلوت", label: "جلوت", cx: 100, cy: 132, r: 16 },
  { id: "أخرى", label: "أخرى", cx: 100, cy: 50, r: 10 },
];

function normalizeGroup(group: string): string {
  const g = group.toLowerCase().trim();
  for (const m of MUSCLE_REGIONS) {
    if (g.includes(m.id) || m.id.includes(g)) return m.id;
  }
  return "أخرى";
}

interface MuscleHeatmapProps {
  distribution: Record<string, number>;
}

export function MuscleHeatmap({ distribution }: MuscleHeatmapProps) {
  const max = Math.max(1, ...Object.values(distribution));
  const regionIntensity: Record<string, number> = {};

  Object.entries(distribution).forEach(([group, count]) => {
    const key = normalizeGroup(group);
    regionIntensity[key] = (regionIntensity[key] ?? 0) + count;
  });

  const regionMax = Math.max(1, ...Object.values(regionIntensity));

  const topTrained = Object.entries(regionIntensity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const weakGroups = Object.entries(regionIntensity)
    .filter(([, v]) => v < regionMax * 0.3)
    .map(([k]) => k);

  return (
    <div className="space-y-4">
      <svg viewBox="0 0 200 220" className="w-full max-w-[200px] mx-auto">
        <ellipse cx="100" cy="38" rx="22" ry="26" fill="var(--surface2)" stroke="var(--border)" />
        <rect x="72" y="58" width="56" height="90" rx="12" fill="var(--surface2)" stroke="var(--border)" />
        <rect x="48" y="62" width="18" height="70" rx="8" fill="var(--surface2)" stroke="var(--border)" />
        <rect x="134" y="62" width="18" height="70" rx="8" fill="var(--surface2)" stroke="var(--border)" />
        <rect x="78" y="148" width="18" height="60" rx="8" fill="var(--surface2)" stroke="var(--border)" />
        <rect x="104" y="148" width="18" height="60" rx="8" fill="var(--surface2)" stroke="var(--border)" />

        {MUSCLE_REGIONS.map((region, i) => {
          const intensity = (regionIntensity[region.id] ?? 0) / regionMax;
          if (intensity < 0.05) return null;
          return (
            <motion.circle
              key={`${region.id}-${i}`}
              cx={region.cx}
              cy={region.cy}
              r={region.r * (0.6 + intensity * 0.5)}
              fill={`rgba(212, 168, 83, ${0.15 + intensity * 0.75})`}
              stroke="var(--gold)"
              strokeWidth={intensity > 0.6 ? 2 : 1}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...MOTION.spring, delay: i * 0.04 }}
            />
          );
        })}
      </svg>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-sm border border-emerald/30 bg-emerald/10">
          <div className="font-bold text-emerald mb-1">الأكثر تدريباً</div>
          {topTrained.length ? topTrained.map(([g, c]) => (
            <div key={g}>{g}: {c} جلسة</div>
          )) : <div className="text-text3">لا بيانات</div>}
        </div>
        <div className="p-2 rounded-sm border border-rose/30 bg-rose/10">
          <div className="font-bold text-rose mb-1">تحتاج اهتمام</div>
          {weakGroups.length ? weakGroups.slice(0, 4).map((g) => (
            <div key={g}>{g}</div>
          )) : <div className="text-text3">متوازن ✓</div>}
        </div>
      </div>

      <div className="text-[10px] text-text3 text-center">
        الحجم الكلي: {Object.values(distribution).reduce((s, v) => s + v, 0)} سجل · أقصى: {max}
      </div>
    </div>
  );
}
