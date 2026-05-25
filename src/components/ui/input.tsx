import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm text-text",
      "placeholder:text-text3 focus:outline-none focus:border-gold/50",
      className
    )}
    {...props}
  />
));
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
