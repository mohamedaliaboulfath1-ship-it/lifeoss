"use client";

import { useCallback, useRef, useState } from "react";

interface VirtualListProps<T> {
  items: T[];
  rowHeight: number;
  maxHeight: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  className?: string;
}

/** Lightweight windowed list — no extra dependencies */
export function VirtualList<T>({
  items,
  rowHeight,
  maxHeight,
  renderRow,
  className,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * rowHeight;
  const height = Math.min(maxHeight, totalHeight || rowHeight);
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const visibleCount = Math.ceil(height / rowHeight) + 4;
  const end = Math.min(items.length, start + visibleCount);

  const onScroll = useCallback(() => {
    if (ref.current) setScrollTop(ref.current.scrollTop);
  }, []);

  if (items.length <= 12) {
    return <div className={className}>{items.map((item, i) => renderRow(item, i))}</div>;
  }

  return (
    <div
      ref={ref}
      className={`overflow-y-auto ${className ?? ""}`}
      style={{ height }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {items.slice(start, end).map((item, i) => (
          <div
            key={start + i}
            style={{
              position: "absolute",
              top: (start + i) * rowHeight,
              left: 0,
              right: 0,
              height: rowHeight,
            }}
          >
            {renderRow(item, start + i)}
          </div>
        ))}
      </div>
    </div>
  );
}
