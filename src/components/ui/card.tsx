import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes } from "react";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "card-premium layered-card surface-l1 border border-border/60 rounded-2xl overflow-hidden",
        "shadow-premium transition-all duration-300 ease-out",
        "hover:border-border2/80 hover:shadow-premium-lg hover:-translate-y-px",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-b border-border flex items-center justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm font-bold flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}
