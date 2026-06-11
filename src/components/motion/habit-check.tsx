"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { habitCheckPop } from "@/lib/motion/list";
import { micro } from "@/lib/motion/micro";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface HabitCheckProps {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
  meta?: string;
  onComplete?: () => void;
  variant?: "row" | "icon";
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function HabitCheck({
  checked,
  disabled,
  onChange,
  label,
  meta,
  onComplete,
  variant = "row",
}: HabitCheckProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [pulse, setPulse] = useState(false);
  const rippleId = useRef(0);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (disabled) return;

    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = ++rippleId.current;
      setRipples((r) => [...r, { id, x, y }]);
      setTimeout(() => setRipples((r) => r.filter((rip) => rip.id !== id)), 400);
    }

    if (!checked) {
      setPulse(true);
      setTimeout(() => setPulse(false), 350);
      onComplete?.();
    }

    onChange();
  }

  const isIcon = variant === "icon";

  return (
    <motion.button
      ref={btnRef}
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label || "إنجاز العادة"}
      disabled={disabled}
      onClick={handleClick}
      layout={!isIcon}
      initial={false}
      animate={
        isIcon
          ? undefined
          : {
              backgroundColor: checked
                ? "color-mix(in srgb, var(--emerald) 12%, transparent)"
                : "color-mix(in srgb, var(--surface2) 50%, transparent)",
            }
      }
      whileTap={disabled ? undefined : micro.hapticPress}
      transition={{ duration: MOTION.duration.fast }}
      className={cn(
        "relative overflow-hidden cursor-pointer focus-ring",
        isIcon
          ? "w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0"
          : "w-full flex items-center gap-3 p-2.5 rounded-sm text-right border transition-colors",
        isIcon
          ? checked
            ? "bg-emerald border-emerald"
            : "border-border2 bg-surface2 hover:border-gold/50"
          : checked
            ? "border-emerald/30"
            : "border-transparent hover:border-border",
        disabled && "opacity-60 pointer-events-none"
      )}
    >
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="absolute rounded-full bg-emerald/30 pointer-events-none"
            style={{ left: r.x, top: r.y, width: 8, height: 8, marginLeft: -4, marginTop: -4 }}
            initial={micro.ripple.initial}
            animate={micro.ripple.animate}
            transition={micro.ripple.transition}
          />
        ))}
      </AnimatePresence>

      {isIcon ? (
        <motion.span className="relative flex items-center justify-center" animate={pulse ? micro.successPulse : undefined}>
          {checked && (
            <motion.span {...habitCheckPop}>
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </motion.span>
          )}
          {pulse && (
            <motion.span
              className="absolute inset-0 rounded-xl border-2 border-emerald"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: MOTION.duration.normal, ease: MOTION.ease.out }}
            />
          )}
        </motion.span>
      ) : (
        <>
          <motion.span
            className={cn(
              "relative w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0",
              checked ? "bg-emerald border-emerald" : "border-border2 bg-surface2"
            )}
            animate={pulse ? micro.successPulse : undefined}
          >
            {checked && (
              <motion.span {...habitCheckPop}>
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </motion.span>
            )}
            {pulse && (
              <motion.span
                className="absolute inset-0 rounded-sm border-2 border-emerald"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: MOTION.duration.normal, ease: MOTION.ease.out }}
              />
            )}
          </motion.span>

          <motion.span
            className={cn("text-sm flex-1 text-right", checked && "line-through text-text3")}
            animate={{ opacity: checked ? 0.65 : 1 }}
            transition={{ duration: MOTION.duration.normal }}
          >
            {label}
          </motion.span>
          {meta && <span className="text-[10px] text-text3">{meta}</span>}
        </>
      )}
    </motion.button>
  );
}
