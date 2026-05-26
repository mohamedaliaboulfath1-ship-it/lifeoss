import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = "✦",
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 rounded-[10px] border border-dashed border-border2 bg-surface/50",
        className
      )}
    >
      <div className="text-4xl mb-3 opacity-80">{icon}</div>
      <h3 className="font-bold text-text mb-1">{title}</h3>
      {description && (
        <p className="text-text3 text-sm max-w-sm mb-4">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="gold" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
