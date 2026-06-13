"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { CountUp } from "@/components/ui/count-up";
import { kpiVariants } from "@/lib/ui/variants";
import { kpiPulse } from "@/lib/motion/dashboard";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  numericValue?: number;
  suffix?: string;
  sub: string;
  color: string;
  badge?: string;
}

export const KpiCard = memo(function KpiCard({
  label,
  value,
  numericValue,
  suffix = "",
  sub,
  color,
  badge,
}: KpiCardProps) {
  return (
    <motion.div
      layout
      className={cn(kpiVariants({ animate: true }), "group liquid-glass glass-blur-md glass-reflect glass-lift relative overflow-hidden")}
      whileHover={kpiPulse}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `linear-gradient(145deg, color-mix(in srgb, ${color} 18%, transparent), transparent 60%)`,
        }}
      />
      <div className="glass-edge" aria-hidden />
      <div className="relative z-[1]">
      <div
        className="absolute top-0 right-0 left-0 h-0.5 opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <div className="text-[10px] text-text3 uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="text-2xl font-black mb-1 tabular-nums" style={{ color }}>
        {numericValue != null ? (
          <>
            <CountUp value={numericValue} suffix={suffix} />
          </>
        ) : (
          value
        )}
      </div>
      <div className="text-[11px] text-text3 font-mono">{sub}</div>
      {badge && (
        <span
          className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full font-mono"
          style={{ background: `${color}20`, color }}
        >
          {badge}
        </span>
      )}
      </div>
    </motion.div>
  );
});
