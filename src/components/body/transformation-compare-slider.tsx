"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion/transitions";

interface TransformationCompareSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel: string;
  afterLabel: string;
  beforeWeight?: number;
  afterWeight?: number;
}

export function TransformationCompareSlider({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
  beforeWeight,
  afterWeight,
}: TransformationCompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    updatePosition(e.clientX);
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const weightDelta =
    beforeWeight != null && afterWeight != null
      ? (afterWeight - beforeWeight).toFixed(1)
      : null;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-text3">
        <span>{beforeLabel}{beforeWeight != null ? ` · ${beforeWeight} كجم` : ""}</span>
        <span>{afterLabel}{afterWeight != null ? ` · ${afterWeight} كجم` : ""}</span>
      </div>

      {weightDelta && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.spring}
          className="text-center text-sm font-bold text-gold2"
        >
          {Number(weightDelta) >= 0 ? "+" : ""}{weightDelta} كجم
        </motion.div>
      )}

      <div
        ref={containerRef}
        className="relative aspect-[3/4] max-h-[480px] rounded-[10px] overflow-hidden border border-border select-none touch-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* After (full) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterUrl} alt={afterLabel} className="absolute inset-0 w-full h-full object-cover" draggable={false} />

        {/* Before (clipped) */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeUrl}
            alt={beforeLabel}
            className="absolute inset-0 h-full object-cover"
            style={{ width: containerRef.current?.offsetWidth ?? "100%", maxWidth: "none" }}
            draggable={false}
          />
        </div>

        {/* Divider + handle */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-lg cursor-ew-resize z-10"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
          onPointerDown={onPointerDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border-2 border-gold shadow-lg flex items-center justify-center">
            <span className="text-[10px] text-[#1a1000] font-bold">↔</span>
          </div>
        </motion.div>

        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-sm bg-black/60 text-[10px] text-white">قبل</div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-sm bg-black/60 text-[10px] text-white">بعد</div>
      </div>

      <input
        type="range"
        min={5}
        max={95}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="w-full accent-gold"
        aria-label="مقارنة التحول"
      />
    </div>
  );
}
