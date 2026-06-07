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
        className={`rounded-[10px] border border-dashed border-border2 bg-surface2/30 flex flex-col items-center justify-center text-xs text-text3 gap-1 ${className}`}
        style={{ height }}
      >
        <span className="text-lg opacity-60">📊</span>
        لا توجد بيانات كافية
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  if (type === "line") {
    const w = Math.max(240, data.length * 48);
    const h = height;
    const pad = 20;
    const points = data
      .map((d, i) => {
        const x = (i / Math.max(1, data.length - 1)) * (w - pad * 2) + pad;
        const y = h - pad - (d.value / max) * (h - pad * 2 - 16);
        return `${x},${y}`;
      })
      .join(" ");

    const areaPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;

    return (
      <div className={`overflow-x-auto ${className}`}>
        <svg width={w} height={h} className="min-w-full" role="img" aria-label="رسم بياني">
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((pct) => (
            <line
              key={pct}
              x1={pad}
              y1={h - pad - pct * (h - pad * 2 - 16)}
              x2={w - pad}
              y2={h - pad - pct * (h - pad * 2 - 16)}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
          ))}
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--border)" strokeWidth="1" />
          <polygon points={areaPoints} fill="url(#chartFill)" />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {data.map((d, i) => {
            const x = (i / Math.max(1, data.length - 1)) * (w - pad * 2) + pad;
            const y = h - pad - (d.value / max) * (h - pad * 2 - 16);
            return (
              <g key={`${d.label}-${i}`}>
                <circle cx={x} cy={y} r="4" fill="var(--surface)" stroke={color} strokeWidth="2" />
                <text x={x} y={h - 4} fontSize="10" textAnchor="middle" fill="var(--text3)">
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
      <div className="h-full flex items-end gap-2 px-1">
        {data.map((d, i) => {
          const barHeight = Math.max(10, (d.value / max) * 100);
          return (
            <div key={d.label} className="flex-1 min-w-[28px] flex flex-col items-center justify-end gap-1.5 group">
              <span className="text-[9px] font-mono text-text3 opacity-0 group-hover:opacity-100 transition-opacity">
                {d.value}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-500 ease-out"
                style={{
                  height: `${barHeight}%`,
                  background: `linear-gradient(180deg, ${color}, color-mix(in srgb, ${color} 40%, transparent))`,
                  animationDelay: `${i * 80}ms`,
                }}
                title={`${d.label}: ${d.value}`}
              />
              <span className="text-[10px] text-text3 truncate w-full text-center">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
