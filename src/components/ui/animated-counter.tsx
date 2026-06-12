"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  className?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({
  value,
  className,
  suffix = "",
  duration = 1.2,
}: AnimatedCounterProps) {
  const reduced = useReducedMotion();
  const spring = useSpring(0, { stiffness: 80, damping: 20, mass: 0.8 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [text, setText] = useState(reduced ? String(value) : "0");
  const mounted = useRef(false);

  useEffect(() => {
    if (reduced) {
      setText(String(value));
      return;
    }
    if (!mounted.current) {
      mounted.current = true;
      spring.set(value);
      return;
    }
    spring.set(value);
  }, [value, spring, reduced]);

  useEffect(() => {
    if (reduced) return;
    const unsub = display.on("change", (v) => setText(String(v)));
    return unsub;
  }, [display, reduced]);

  if (reduced) {
    return (
      <span className={cn("tabular-nums", className)}>
        {value}
        {suffix}
      </span>
    );
  }

  return (
    <motion.span
      className={cn("tabular-nums", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration * 0.3 }}
    >
      {text}
      {suffix}
    </motion.span>
  );
}
