"use client";

import Link from "next/link";
import { GlassCard } from "@/components/glass";
import { getDailyQuote } from "@/lib/wisdom/quotes";

export function WisdomWidget() {
  const quote = getDailyQuote();

  return (
    <GlassCard className="p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-gold2 font-mono mb-2">✨ حكمة اليوم</p>
          <p className="text-sm text-text leading-relaxed line-clamp-3">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="text-xs text-text3 mt-2">— {quote.author}</p>
        </div>
        <Link
          href="/wisdom"
          className="shrink-0 text-xs text-sky2 hover:text-gold2 transition-colors"
        >
          المزيد
        </Link>
      </div>
    </GlassCard>
  );
}
