"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { AreaPreview } from "@/types/areas";

interface Props {
  preview: AreaPreview;
}

export function AreaPreviewCard({ preview }: Props) {
  return (
    <Link href={`/areas/${preview.slug}`}>
      <Card
        className="p-4 h-full hover:border-gold/40 transition-all cursor-pointer group"
        style={{ borderColor: `${preview.color}30` }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{preview.icon}</span>
            <div>
              <div className="font-bold group-hover:text-gold2 transition-colors">{preview.nameAr}</div>
              <div className="text-[10px] text-text3">Health Score: {preview.healthScore}%</div>
            </div>
          </div>
          <div
            className="text-lg font-black font-mono"
            style={{ color: preview.color }}
          >
            {preview.healthScore}
          </div>
        </div>

        <ProgressBar value={preview.healthScore} color={preview.color} className="h-1.5 mb-3" />

        <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
          <StatChip label="أهداف" value={preview.activeGoals} href={`/areas/${preview.slug}#goals`} />
          <StatChip label="عادات" value={preview.habits} href={`/areas/${preview.slug}#habits`} />
          <StatChip label="مهام" value={preview.tasks} href={`/areas/${preview.slug}#tasks`} />
          <StatChip label="كتب" value={preview.books} href={`/areas/${preview.slug}#books`} />
        </div>

        {preview.highlights.slice(0, 4).map((h) => (
          <div key={h.label} className="text-[10px] text-text3 truncate">
            <span className="text-text2">{h.label}:</span> {h.value}
          </div>
        ))}

        {preview.needsAttention.length > 0 && (
          <div className="mt-2 text-[10px] text-amber2 border-t border-border/50 pt-2 truncate">
            ⚠️ {preview.needsAttention[0]}
          </div>
        )}
      </Card>
    </Link>
  );
}

function StatChip({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="px-2 py-1 rounded-sm bg-surface2/80 hover:bg-surface2 flex justify-between"
    >
      <span className="text-text3">{label}</span>
      <span className="font-mono font-bold">{value}</span>
    </Link>
  );
}
