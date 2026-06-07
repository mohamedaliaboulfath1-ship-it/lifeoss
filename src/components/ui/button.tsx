"use client";

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import { buttonHover, buttonTap } from "@/lib/motion/button";
import { MOTION } from "@/lib/motion";
import { forwardRef, type ReactNode } from "react";
import { Loader2, Check } from "lucide-react";

type Variant = "ghost" | "gold" | "danger";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: Variant;
  size?: "sm" | "md";
  loading?: boolean;
  success?: boolean;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  ghost:
    "bg-transparent text-text2 border border-border hover:bg-surface2 hover:text-text hover:border-border2",
  gold: "bg-gradient-to-br from-gold to-gold2 text-[#1a1000] font-bold hover:opacity-90 border-0 shadow-premium",
  danger:
    "bg-rose/15 text-rose2 border border-rose/30 hover:bg-rose/25",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "md",
      loading = false,
      success = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileHover={isDisabled ? undefined : buttonHover}
        whileTap={isDisabled ? undefined : buttonTap}
        animate={success ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={{ duration: MOTION.duration.normal, ease: MOTION.ease.out }}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-sm font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-ring transform-gpu",
          size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs",
          variants[variant],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {success && !loading && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={MOTION.spring.snappy}
          >
            <Check className="w-3.5 h-3.5" />
          </motion.span>
        )}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
