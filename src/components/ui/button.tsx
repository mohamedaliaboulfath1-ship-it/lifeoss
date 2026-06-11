"use client";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/ui/variants";
import { motion, type HTMLMotionProps } from "framer-motion";
import { buttonHover, buttonTap } from "@/lib/motion/button";
import { MOTION } from "@/lib/motion";
import { forwardRef, type ReactNode } from "react";
import { Loader2, Check } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

type Variant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: Variant;
  size?: "sm" | "md";
  loading?: boolean;
  success?: boolean;
  children?: ReactNode;
}

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
        className={cn(buttonVariants({ variant, size }), className)}
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
