"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface TrajectoryPoint {
  label: string;
  value: number;
  forecast?: boolean;
}

interface GoalTrajectoryProps {
  history: TrajectoryPoint[];
  current: number;
  target: number;
  forecastPoints?: TrajectoryPoint[];
  color?: string;
  forecastColor?: string;
  height?: number;
  className?: string;
  unit?: string;
}

export function GoalTrajectory({
  history,
  current,
  target,
  forecastPoints = [],
  color = "var(--gold)",
  forecastColor = "var(--sky)",
  height = 120,
  className,
  unit = "كجم",
}: GoalTrajectoryProps) {
  const allPoints = useMemo(() => {
    const hist = history.map((p) => ({ ...p, forecast: false }));
    const fc = forecastPoints.map((p) => ({ ...p, forecast: true }));
    return [...hist, ...fc];
  }, [history, forecastPoints]);

  if (allPoints.length < 2) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border2 flex items-center justify-center text-xs text-text3",
          className
        )}
        style={{ height }}
      >
        سجّل قياسات أكثر لرؤية المسار
      </div>
    );
  }

  const values = allPoints.map((p) => p.value);
  const min = Math.min(...values, target) - 1;
  const max = Math.max(...values, target, current) + 1;
  const range = max - min || 1;

  const w = Math.max(280, allPoints.length * 44);
  const pad = 24;
  const plotH = height - pad * 2;

  const coords = allPoints.map((p, i) => {
    const x = pad + (i / Math.max(1, allPoints.length - 1)) * (w - pad * 2);
    const y = pad + plotH - ((p.value - min) / range) * plotH;
    return { x, y, ...p };
  });

  const histEnd = history.length - 1;
  const histPath = coords
    .slice(0, histEnd + 1)
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  const forecastStart = coords[histEnd];
  const forecastPath =
    forecastPoints.length > 0 && forecastStart
      ? `M ${forecastStart.x} ${forecastStart.y} ` +
        coords
          .slice(histEnd + 1)
          .map((c) => `L ${c.x} ${c.y}`)
          .join(" ")
      : "";

  const targetY = pad + plotH - ((target - min) / range) * plotH;
  const currentY = pad + plotH - ((current - min) / range) * plotH;

  return (
    <div className={cn("overflow-x-auto", className)}>
      <svg width={w} height={height} className="min-w-full" role="img" aria-label="مسار الهدف">
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1={pad}
            y1={pad + plotH * (1 - pct)}
            x2={w - pad}
            y2={pad + plotH * (1 - pct)}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.4"
          />
        ))}

        <motion.line
          x1={pad}
          y1={targetY}
          x2={w - pad}
          y2={targetY}
          stroke="var(--emerald)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity="0.6"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.6 }}
          viewport={{ once: false, amount: 0.35 }}
          transition={{ duration: MOTION.duration.slow, ease: MOTION.ease.out }}
        />
        <text x={w - pad - 4} y={targetY - 6} textAnchor="end" className="fill-emerald2 text-[9px]">
          هدف {target}{unit}
        </text>

        <motion.path
          d={histPath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: false, amount: 0.35 }}
          transition={{ duration: MOTION.duration.chart, ease: MOTION.ease.out }}
        />

        {forecastPath && (
          <motion.path
            d={forecastPath}
            fill="none"
            stroke={forecastColor}
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0.4 }}
            whileInView={{ pathLength: 1, opacity: 0.85 }}
            viewport={{ once: false, amount: 0.35 }}
            transition={{ duration: MOTION.duration.chart, delay: 0.15, ease: MOTION.ease.out }}
          />
        )}

        {coords.map((c, i) => (
          <motion.circle
            key={`${c.label}-${i}`}
            cx={c.x}
            cy={c.y}
            r={c.forecast ? 3 : 4}
            fill={c.forecast ? forecastColor : color}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: false, amount: 0.35 }}
            transition={{ delay: 0.08 * i, ...MOTION.spring.snappy }}
          />
        ))}

        <motion.circle
          cx={coords[histEnd]?.x ?? pad}
          cy={currentY}
          r="6"
          fill={color}
          stroke="var(--surface)"
          strokeWidth="2"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: false, amount: 0.35 }}
          transition={MOTION.spring.snappy}
        />
      </svg>
      <div className="flex justify-between px-2 mt-1 text-[9px] text-text3 font-mono">
        {allPoints.filter((_, i) => i === 0 || i === allPoints.length - 1 || i === histEnd).map((p, i) => (
          <span key={i}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}

/** Build forecast points from current weight toward target */
export function buildWeightForecast(
  current: number,
  target: number,
  weeklyRate: number,
  weeks = 8
): TrajectoryPoint[] {
  if (weeklyRate <= 0 || current >= target) return [];
  const points: TrajectoryPoint[] = [];
  for (let w = 1; w <= weeks; w++) {
    const projected = Math.min(target, current + weeklyRate * w);
    points.push({
      label: `+${w}أ`,
      value: Math.round(projected * 10) / 10,
      forecast: true,
    });
    if (projected >= target) break;
  }
  return points;
}
