interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  color: string;
  badge?: string;
}

export function KpiCard({ label, value, sub, color, badge }: KpiCardProps) {
  return (
    <div className="bg-surface border border-border rounded-[10px] p-[18px] relative overflow-hidden transition-colors hover:border-border2">
      <div
        className="absolute top-0 right-0 left-0 h-0.5"
        style={{ background: color }}
      />
      <div className="text-[10px] text-text3 uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="text-2xl font-black mb-1" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] text-text3 font-mono">{sub}</div>
      {badge && (
        <span
          className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full font-mono"
          style={{ background: `${color}20`, color }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
