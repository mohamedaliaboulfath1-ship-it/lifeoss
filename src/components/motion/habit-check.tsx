"use client";

import { motion } from "framer-motion";
import { habitCheckPop } from "@/lib/motion/list";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface HabitCheckProps {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
  meta?: string;
}

export function HabitCheck({
  checked,
  disabled,
  onChange,
  label,
  meta,
}: HabitCheckProps) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      layout
      initial={false}
      animate={{
        backgroundColor: checked
          ? "color-mix(in srgb, var(--emerald) 10%, transparent)"
          : "color-mix(in srgb, var(--surface2) 50%, transparent)",
      }}
      whileTap={{ scale: disabled ? 1 : MOTION.scale.press }}
      transition={{ duration: MOTION.duration.fast }}
      className={cn(
        "w-full flex items-center gap-3 p-2.5 rounded-sm cursor-pointer text-right",
        "border transition-colors focus-ring",
        checked ? "border-emerald/25" : "border-transparent hover:border-border",
        disabled && "opacity-60 pointer-events-none"
      )}
    >
      <span
        className={cn(
          "w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors",
          checked ? "bg-emerald border-emerald" : "border-border2 bg-surface2"
        )}
      >
        {checked && (
          <motion.span {...habitCheckPop}>
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </motion.span>
        )}
      </span>
      <motion.span
        className={cn("text-sm flex-1 text-right", checked && "line-through text-text3")}
        animate={{ opacity: checked ? 0.65 : 1 }}
        transition={{ duration: MOTION.duration.normal }}
      >
        {label}
      </motion.span>
      {meta && <span className="text-[10px] text-text3">{meta}</span>}
    </motion.button>
  );
}
