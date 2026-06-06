import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  extraActions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  extraActions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="font-display text-2xl font-black text-text">{title}</h2>
        {subtitle && <p className="text-text3 text-sm mt-1">{subtitle}</p>}
      </div>
      {(actionLabel || extraActions) && (
        <div className="flex gap-2 flex-wrap">
          {extraActions}
          {actionLabel && onAction && (
            <Button variant="gold" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
