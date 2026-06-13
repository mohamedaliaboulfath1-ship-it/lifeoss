"use client";

import { MotionCard } from "@/components/motion/motion";
import { ShelfReveal } from "@/components/motion/unfold-reveal";
import { BookCover } from "@/components/dashboard/book-cover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { READING_PLAN_PHASES } from "@/lib/seed/mohamed-books-library-data";
import type { Book } from "@/types/lifeos";

export type LibraryBook = Book & { coverUrl?: string; category?: string };

const PRIORITY_LABEL: Record<string, string> = {
  high: "عالي",
  med: "متوسط",
  low: "منخفض",
};

const STATUS_LABEL: Record<string, string> = {
  planned: "مخطط",
  reading: "قيد القراءة",
  done: "مكتمل",
};

export function sortBooksByReadingPlan(a: LibraryBook, b: LibraryBook) {
  const pa = a.readingPhase ?? 99;
  const pb = b.readingPhase ?? 99;
  if (pa !== pb) return pa - pb;
  const oa = a.readingPlanOrder ?? 99;
  const ob = b.readingPlanOrder ?? 99;
  if (oa !== ob) return oa - ob;
  const prio = { high: 0, med: 1, low: 2 };
  const prA = prio[a.priority ?? "low"];
  const prB = prio[b.priority ?? "low"];
  if (prA !== prB) return prA - prB;
  return a.title.localeCompare(b.title);
}

export function BooksReadingRoadmap({
  books,
  onOpen,
  onEdit,
}: {
  books: LibraryBook[];
  onOpen: (book: LibraryBook, rect: DOMRect) => void;
  onEdit: (book: LibraryBook) => void;
}) {
  const sorted = [...books].sort(sortBooksByReadingPlan);
  const byPhase = new Map<number, LibraryBook[]>();
  for (const b of sorted) {
    const phase = b.readingPhase ?? 6;
    const list = byPhase.get(phase) ?? [];
    list.push(b);
    byPhase.set(phase, list);
  }

  const phasesWithBooks = READING_PLAN_PHASES.filter((ph) => (byPhase.get(ph.phase) ?? []).length > 0);

  if (!phasesWithBooks.length) {
    return (
      <p className="text-sm text-text3 text-center py-8">
        لا توجد كتب في خطة القراءة بعد. أضف كتباً أو شغّل بذر المكتبة.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {phasesWithBooks.map((ph) => {
        const phaseBooks = byPhase.get(ph.phase) ?? [];
        const done = phaseBooks.filter((b) => b.status === "done").length;
        const phasePct = phaseBooks.length ? Math.round((done / phaseBooks.length) * 100) : 0;

        return (
          <Card key={ph.phase} className="p-4 glass-premium">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
              <div>
                <div className="text-sm font-bold text-gold2">{ph.titleAr}</div>
                <div className="text-[11px] text-text3 mt-0.5">{ph.description}</div>
              </div>
              <div className="text-xs text-text3 shrink-0">
                {done}/{phaseBooks.length} مكتمل · {phasePct}%
              </div>
            </div>
            <ProgressBar value={phasePct} color="var(--gold)" className="mb-4" />
            <div className="space-y-2">
              {phaseBooks.map((b) => {
                const pct =
                  b.progressPct ??
                  (b.pages ? Math.round(((b.curPage ?? 0) / b.pages) * 100) : 0);
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 p-2 rounded-md bg-surface2/50 hover:bg-surface2 transition-colors"
                  >
                    <button
                      type="button"
                      className="w-10 h-14 shrink-0 rounded overflow-hidden border border-border"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        onOpen(b, rect);
                      }}
                    >
                      <BookCover title={b.title} coverUrl={b.coverUrl} coverPath={b.coverPath} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{b.title}</div>
                      <div className="text-[10px] text-text3 truncate">
                        {b.author}
                        {b.category ? ` · ${b.category}` : ""}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-text3">
                        <span>{b.status ? (STATUS_LABEL[b.status] ?? b.status) : "—"}</span>
                        {b.priority && <span>· {PRIORITY_LABEL[b.priority] ?? b.priority}</span>}
                        {b.estimatedReadingHours != null && (
                          <span>· ~{b.estimatedReadingHours} ساعة</span>
                        )}
                        {b.goodreadsRating != null && <span>· ★ {b.goodreadsRating}</span>}
                      </div>
                      <ProgressBar value={pct} color="var(--sky)" className="mt-1.5" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(b)}>
                      ✏️
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function BooksCategoryShelf({
  books,
  onOpen,
}: {
  books: LibraryBook[];
  onOpen: (book: LibraryBook, rect: DOMRect) => void;
}) {
  const byCategory = new Map<string, LibraryBook[]>();
  for (const b of books) {
    const cat = b.category ?? b.field ?? "غير مصنّف";
    const list = byCategory.get(cat) ?? [];
    list.push(b);
    byCategory.set(cat, list);
  }

  const categories = [...byCategory.keys()].sort((a, b) => a.localeCompare(b));

  if (!categories.length) {
    return <p className="text-sm text-text3 text-center py-8">لا توجد كتب لعرضها على الرف.</p>;
  }

  return (
    <div className="space-y-8">
      {categories.map((cat, rowIndex) => {
        const shelfBooks = [...(byCategory.get(cat) ?? [])].sort(sortBooksByReadingPlan);
        return (
          <ShelfReveal key={cat} rowIndex={rowIndex}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gold2 font-bold uppercase tracking-wider">{cat}</div>
              <span className="text-[10px] text-text3">{shelfBooks.length} كتاب</span>
            </div>
            <div className="flex items-end gap-1.5 pb-2 border-b-4 border-[#3d2b1f] px-2 min-h-[150px] overflow-x-auto">
              {shelfBooks.map((b, i) => (
                <MotionCard
                  key={b.id}
                  layout
                  className="shrink-0 cursor-pointer group"
                  style={{ marginBottom: i % 2 === 0 ? 0 : 10 }}
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    onOpen(b, rect);
                  }}
                >
                  <div className="relative w-[4.5rem] h-[6.75rem] rounded-sm overflow-hidden border border-border shadow-md group-hover:-translate-y-1 transition-transform">
                    <BookCover title={b.title} coverUrl={b.coverUrl} coverPath={b.coverPath} />
                    {b.priority === "high" && (
                      <span className="absolute top-0 right-0 bg-gold text-[8px] px-1 text-black font-bold">
                        ★
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-text3 mt-1 max-w-[4.5rem] truncate text-center">
                    {b.title}
                  </div>
                </MotionCard>
              ))}
            </div>
          </ShelfReveal>
        );
      })}
    </div>
  );
}
