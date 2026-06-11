"use client";

import { useEffect, useId } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { CountUp } from "@/components/ui/count-up";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  pulse?: boolean;
  showValue?: boolean;
  suffix?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 6,
  color = "var(--gold)",
  trackColor = "var(--border)",
  label,
  sublabel,
  pulse = false,
  showValue = true,
  suffix = "",
  className,
  children,
}: ProgressRingProps) {
  const uid = useId().replace(/:/g, "");
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, value));

  const spring = useSpring(0, MOTION.spring.soft);
  useEffect(() => {
    spring.set(clamped);
  }, [clamped, spring]);

  const offset = useTransform(spring, (v) => circ - (v / 100) * circ);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <motion.div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      animate={pulse ? microScoreBump() : undefined}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeLinecap="round"
          style={{ strokeDashoffset: offset }}
        />
        <defs>
          <linearGradient id={`ringGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--sky) 40%, transparent)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? (
          showValue && (
            <>
              <span className="font-black text-gold2 leading-none" style={{ fontSize: size * 0.22 }}>
                <CountUp value={Math.round(clamped)} suffix={suffix} />
              </span>
              {label && (
                <span className="text-text3 mt-0.5" style={{ fontSize: size * 0.09 }}>
                  {label}
                </span>
              )}
              {sublabel && (
                <span className="text-text3/70" style={{ fontSize: size * 0.08 }}>
                  {sublabel}
                </span>
              )}
            </>
          )
        )}
      </div>
    </motion.div>
  );
}

function microScoreBump() {
  return {
    scale: [1, 1.04, 1],
    transition: { duration: MOTION.duration.normal, ease: MOTION.ease.out },
  };
}
