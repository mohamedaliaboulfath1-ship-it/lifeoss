interface ProgressBarProps {
  value: number;
  color?: string;
  className?: string;
}

export function ProgressBar({
  value,
  color = "var(--gold)",
  className = "",
}: ProgressBarProps) {
  return (
    <div
      className={`h-1.5 bg-surface3 rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}
