"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";
import { InputHTMLAttributes, forwardRef, useState } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, onFocus, onBlur, ...props }, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      className="relative w-full"
      animate={{
        boxShadow: focused
          ? "0 0 0 3px color-mix(in srgb, var(--gold) 12%, transparent)"
          : "0 0 0 0px transparent",
      }}
      transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.out }}
      style={{ borderRadius: "var(--radius-sm, 6px)" }}
    >
      <input
        ref={ref}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className={cn(
          "w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm text-text",
          "placeholder:text-text3 focus:outline-none focus:border-gold/50 transition-colors duration-150",
          className
        )}
        {...props}
      />
    </motion.div>
  );
});
Input.displayName = "Input";

export function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "block text-[10px] text-text3 uppercase tracking-wide mb-1.5",
        className
      )}
    >
      {children}
    </label>
  );
}
