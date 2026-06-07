import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "ghost" | "gold" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
}

const variants: Record<Variant, string> = {
  ghost:
    "bg-transparent text-text2 border border-border hover:bg-surface2 hover:text-text hover:border-border2 active:scale-[0.98]",
  gold: "bg-gradient-to-br from-gold to-gold2 text-[#1a1000] font-bold hover:opacity-90 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] border-0 shadow-premium",
  danger:
    "bg-rose/15 text-rose2 border border-rose/30 hover:bg-rose/25 active:scale-[0.98]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "ghost", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-sm font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-ring",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs",
        variants[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
