"use client";

interface MiniChartPoint {
  label: string;
  value: number;
}

interface MiniChartProps {
  data: MiniChartPoint[];
  type?: "bar" | "line";
  color?: string;
  height?: number;
  className?: string;
}

export function MiniChart({
  data,
  type = "bar",
  color = "var(--gold)",
  height = 140,
  className = "",
}: MiniChartProps) {
  if (!data.length) {
    return (
      <div
        className={`rounded-sm border border-border/70 bg-surface2/40 flex items-center justify-center text-xs text-text3 ${className}`}
        style={{ height }}
      >
        لا توجد بيانات كافية
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  if (type === "line") {
    const w = Math.max(240, data.length * 40);
    const h = height;
    const points = data
      .map((d, i) => {
        const x = (i / Math.max(1, data.length - 1)) * (w - 16) + 8;
        const y = h - (d.value / max) * (h - 26) - 14;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className={`overflow-x-auto ${className}`}>
        <svg width={w} height={h} className="min-w-full">
          <line x1="8" y1={h - 14} x2={w - 8} y2={h - 14} stroke="var(--border)" strokeWidth="1" />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {data.map((d, i) => {
            const x = (i / Math.max(1, data.length - 1)) * (w - 16) + 8;
            const y = h - (d.value / max) * (h - 26) - 14;
            return (
              <g key={`${d.label}-${i}`}>
                <circle cx={x} cy={y} r="3" fill={color} />
                <text x={x} y={h - 2} fontSize="10" textAnchor="middle" fill="var(--text3)">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`} style={{ height }}>
      <div className="h-full flex items-end gap-1.5">
        {data.map((d) => {
          const barHeight = Math.max(8, (d.value / max) * 100);
          return (
            <div key={d.label} className="flex-1 min-w-[24px] flex flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: `${barHeight}%`,
                  background: `linear-gradient(180deg, ${color}, color-mix(in srgb, ${color} 50%, transparent))`,
                }}
                title={`${d.label}: ${d.value}`}
              />
              <span className="text-[10px] text-text3">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
