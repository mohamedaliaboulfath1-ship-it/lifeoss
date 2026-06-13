"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass";
import {
  WISDOM_CATEGORIES,
  WISDOM_QUOTES,
  getDailyQuote,
  type WisdomCategory,
} from "@/lib/wisdom/quotes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function WisdomPage() {
  const daily = getDailyQuote();
  const [category, setCategory] = useState<WisdomCategory | "all">("all");

  const filtered =
    category === "all"
      ? WISDOM_QUOTES
      : WISDOM_QUOTES.filter((q) => q.category === category);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8" data-tour="main-content">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="font-display text-2xl font-black text-gold2 mb-2">
            ✨ الحكمة والتحفيز
          </h1>
          <p className="text-text2 text-sm">
            اقتباسات من أعمال الملكية العامة وملخصات أصلية — تتجدد يومياً.
          </p>
        </header>

        <GlassCard className="p-8 text-center">
          <p className="text-xs text-gold2 font-mono mb-4">اقتباس اليوم</p>
          <blockquote className="text-lg md:text-xl font-medium text-text leading-relaxed">
            &ldquo;{daily.text}&rdquo;
          </blockquote>
          <cite className="block mt-4 text-sm text-text3 not-italic">
            — {daily.author}
          </cite>
          {daily.summary && (
            <p className="mt-4 text-sm text-text2 max-w-md mx-auto">{daily.summary}</p>
          )}
        </GlassCard>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs border transition-colors",
              category === "all"
                ? "border-gold bg-gold/15 text-gold2"
                : "border-border2 text-text3"
            )}
          >
            الكل
          </button>
          {WISDOM_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs border transition-colors",
                category === c.id
                  ? "border-gold bg-gold/15 text-gold2"
                  : "border-border2 text-text3"
              )}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((q) => (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard className="p-5">
                  <p className="text-text leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                  <div className="flex items-center justify-between mt-3">
                    <cite className="text-xs text-text3 not-italic">— {q.author}</cite>
                    <span className="text-[10px] text-text3 font-mono uppercase">
                      {WISDOM_CATEGORIES.find((c) => c.id === q.category)?.label}
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
