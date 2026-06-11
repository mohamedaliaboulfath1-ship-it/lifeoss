"use client";

import { motion } from "framer-motion";
import { ProgressRing } from "@/components/ui/progress-ring";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ProgressJourneyProps {
  current: number;
  target: number;
  unit?: string;
  label?: string;
  className?: string;
  /** e.g. "رحلة التحول الجسدي" */
  journeyLabel?: string;
}

export function ProgressJourney({
  current,
  target,
  unit = "كجم",
  label,
  className,
  journeyLabel = "رحلتك",
}: ProgressJourneyProps) {
  const pct =
    target > 0 && current > 0
      ? Math.min(100, Math.round((current / target) * 100))
      : 0;
  const remaining = Math.round((target - current) * 10) / 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration.normal, ease: MOTION.ease.out }}
      className={cn("flex items-center gap-4", className)}
    >
      <ProgressRing value={pct} size={64} strokeWidth={5} color="var(--gold)" showValue suffix="%" />
      <div className="min-w-0">
        {label && <p className="text-[10px] uppercase tracking-widest text-text3 mb-1">{label}</p>}
        <p className="text-sm text-text2 leading-relaxed">
          أكملت{" "}
          <span className="font-black text-gold2">{pct}%</span> من {journeyLabel}.
        </p>
        <p className="text-xs text-text3 mt-1">
          <span className="font-mono text-gold2">{current}</span>
          {unit} → <span className="font-mono text-emerald2">{target}</span>
          {unit}
          {remaining > 0 && (
            <> · متبقي <span className="font-mono text-sky2">{remaining}</span> {unit}</>
          )}
        </p>
      </div>
    </motion.div>
  );
}
