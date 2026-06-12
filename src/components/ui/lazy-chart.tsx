"use client";

import { memo, type ComponentProps } from "react";
import { useInViewEnter } from "@/hooks/use-in-view-enter";
import { MiniChart } from "@/components/ui/mini-chart";

type LazyChartProps = ComponentProps<typeof MiniChart>;

function LazyChartInner(props: LazyChartProps) {
  const { ref, isInView } = useInViewEnter(0.08);

  return (
    <div ref={ref} className={props.className}>
      {isInView ? (
        <MiniChart {...props} className="" />
      ) : (
        <div
          className="rounded-[10px] border border-border/40 bg-surface2/30 skeleton-shimmer"
          style={{ height: props.height ?? 140 }}
        />
      )}
    </div>
  );
}

export const LazyChart = memo(LazyChartInner);
