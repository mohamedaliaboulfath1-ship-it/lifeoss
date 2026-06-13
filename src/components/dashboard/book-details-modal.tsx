"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BookCoverPicker } from "@/components/ui/book-cover-picker";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LazyChart } from "@/components/ui/lazy-chart";
import { BookCoverImage } from "@/components/dashboard/book-cover-image";
import { BookNotesEditor } from "@/components/dashboard/book-notes-editor";
import {
  computeBookAnalytics,
  type BookSession,
} from "@/lib/books/book-analytics";
import {
  READING_STATUS_CONFIG,
  type ReadingStatus,
} from "@/lib/books/book-status";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { Book, Goal } from "@/types/lifeos";
import { cn } from "@/lib/utils";

type BookDetailsModalProps = {
  book: Book | null;
  sessions: BookSession[];
  goals: Goal[];
  open: boolean;
  onClose: () => void;
  onPatch: (id: string, patch: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (book: Book) => void;
  onUploadCover: (bookId: string, file: File) => Promise<string>;
  onRefresh: () => void;
};

function formatDate(d?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export function BookDetailsModal({
  book,
  sessions,
  goals,
  open,
  onClose,
  onPatch,
  onDelete,
  onEdit,
  onUploadCover,
  onRefresh,
}: BookDetailsModalProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [curPageInput, setCurPageInput] = useState("");
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!book) return;
    setNotes(book.richNotes ?? book.notes ?? "");
    setCurPageInput(String(book.curPage ?? 0));
    setCoverUrl(book.coverUrl ?? "");
    setCoverPreview(book.coverUrl ?? null);
    setShowCoverPicker(false);
  }, [book?.id, book, open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const analytics = useMemo(
    () => (book ? computeBookAnalytics(book, sessions) : null),
    [book, sessions]
  );

  const linkedGoal = useMemo(
    () => goals.find((g) => g.id === book?.goalId),
    [goals, book?.goalId]
  );

  const pct = useMemo(() => {
    if (!book?.pages) return 0;
    return Math.round(((book.curPage ?? 0) / book.pages) * 100);
  }, [book?.curPage, book?.pages]);

  const saveNotes = useCallback(
    async (text: string) => {
      if (!book) return;
      setNotesSaving(true);
      const ok = await onPatch(book.id, { richNotes: text });
      if (ok) {
        setLastSaved(
          new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
        );
      }
      setNotesSaving(false);
    },
    [book, onPatch]
  );

  useEffect(() => {
    if (!book || !open) return;
    if (notes === (book.richNotes ?? book.notes ?? "")) return;
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      void saveNotes(notes);
    }, 3000);
    return () => {
      if (notesTimer.current) clearTimeout(notesTimer.current);
    };
  }, [notes, book, open, saveNotes]);

  async function updateProgress(delta: number) {
    if (!book) return;
    const pages = book.pages ?? 200;
    const cur = Math.max(0, Math.min(pages, (book.curPage ?? 0) + delta));
    const readingStatus: ReadingStatus =
      cur >= pages ? "completed" : cur > 0 ? "reading" : book.readingStatus ?? "planned";
    const ok = await onPatch(book.id, {
      curPage: cur,
      readingStatus,
      status: cur >= pages ? "done" : cur > 0 ? "reading" : "planned",
    });
    if (ok) {
      setCurPageInput(String(cur));
      onRefresh();
    }
  }

  async function setManualPage() {
    if (!book) return;
    const cur = Math.max(0, Math.min(book.pages ?? 200, parseInt(curPageInput, 10) || 0));
    const readingStatus: ReadingStatus =
      cur >= (book.pages ?? 200)
        ? "completed"
        : cur > 0
          ? "reading"
          : book.readingStatus ?? "planned";
    const ok = await onPatch(book.id, {
      curPage: cur,
      readingStatus,
      status: cur >= (book.pages ?? 200) ? "done" : cur > 0 ? "reading" : "planned",
    });
    if (ok) onRefresh();
  }

  async function setStatus(status: ReadingStatus) {
    if (!book) return;
    const ok = await onPatch(book.id, { readingStatus: status });
    if (ok) onRefresh();
  }

  async function markCompleted() {
    if (!book || !confirm("تعليم الكتاب كمكتمل؟")) return;
    const ok = await onPatch(book.id, {
      curPage: book.pages ?? book.curPage ?? 0,
      readingStatus: "completed",
      status: "done",
      finishDate: new Date().toISOString().slice(0, 10),
    });
    if (ok) onRefresh();
  }

  async function archiveBook() {
    if (!book || !confirm("أرشفة هذا الكتاب؟")) return;
    const ok = await onPatch(book.id, { archived: true });
    if (ok) {
      onClose();
      onRefresh();
    }
  }

  async function handleDelete() {
    if (!book || !confirm("حذف الكتاب نهائياً؟")) return;
    await onDelete(book.id);
    onClose();
  }

  async function removeCover() {
    if (!book || !confirm("إزالة الغلاف؟")) return;
    const ok = await onPatch(book.id, { removeCover: true, coverPath: null });
    if (ok) {
      setCoverUrl("");
      setCoverPreview(null);
      onRefresh();
    }
  }

  if (!mounted || !book) return null;

  const status = book.readingStatus ?? "planned";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[320] flex items-center justify-center p-3 sm:p-5"
          style={{ backdropFilter: "blur(12px)" }}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60" aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={reduced ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-[1] w-[95vw] max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 glass-premium shadow-premium-lg flex flex-col"
          >
            <header className="shrink-0 flex items-start justify-between gap-3 px-5 py-4 border-b border-white/5">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gold2 truncate">{book.title}</h2>
                {book.author && (
                  <p className="text-sm text-text3 truncate">{book.author}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-text3 hover:text-text text-xl px-2"
                aria-label="إغلاق"
              >
                ×
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="grid lg:grid-cols-[minmax(200px,260px)_1fr] gap-6">
                {/* Left — Cover */}
                <div className="space-y-3">
                  <div className="mx-auto lg:mx-0">
                    <BookCoverImage
                      title={book.title}
                      coverUrl={coverPreview ?? book.coverUrl}
                      coverPath={book.coverPath}
                      size="full"
                      className="rounded-xl max-w-[260px] mx-auto lg:mx-0"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    <Button size="sm" variant="ghost" onClick={() => setShowCoverPicker((v) => !v)}>
                      رفع غلاف
                    </Button>
                    <Button size="sm" variant="ghost" onClick={removeCover}>
                      إزالة
                    </Button>
                  </div>
                  {showCoverPicker && (
                    <div className="rounded-xl border border-border/50 p-3 bg-surface2/30">
                      <BookCoverPicker
                        title={book.title}
                        author={book.author}
                        coverUrl={coverUrl}
                        coverPreview={coverPreview}
                        onCoverUrlChange={async (url) => {
                          setCoverUrl(url);
                          setCoverPreview(url);
                          await onPatch(book.id, { coverUrl: url });
                          onRefresh();
                        }}
                        onFileSelect={async (file) => {
                          const path = await onUploadCover(book.id, file);
                          if (path) onRefresh();
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Right — Info */}
                <div className="space-y-5 min-w-0">
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(READING_STATUS_CONFIG) as ReadingStatus[]).map((s) => {
                      const cfg = READING_STATUS_CONFIG[s];
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void setStatus(s)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                            status === s ? "border-current" : "border-border opacity-70 hover:opacity-100"
                          )}
                          style={{
                            color: cfg.color,
                            background: status === s ? cfg.bg : "transparent",
                          }}
                        >
                          {cfg.labelAr}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {[
                      ["التصنيف", book.category ?? "—"],
                      ["الصفحات", book.pages ?? "—"],
                      ["الصفحة الحالية", book.curPage ?? 0],
                      ["تاريخ الإضافة", formatDate(book.createdAt?.slice(0, 10))],
                      ["بدء القراءة", formatDate(book.startDate)],
                      ["انتهاء القراءة", formatDate(book.finishDate)],
                      [
                        "إنجاز متوقع",
                        analytics?.estimatedFinishDate
                          ? formatDate(analytics.estimatedFinishDate)
                          : "—",
                      ],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-border/40 p-2.5 bg-surface2/20">
                        <div className="text-[10px] text-text3">{k}</div>
                        <div className="font-semibold truncate">{v}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text3">التقدم</span>
                      <span className="font-bold text-sky2">{pct}%</span>
                    </div>
                    <div className="h-2.5 bg-surface2 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-l from-sky to-emerald rounded-full"
                        initial={false}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <Button size="sm" variant="gold" onClick={() => updateProgress(10)}>
                      +10
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => updateProgress(5)}>
                      +5
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => updateProgress(20)}>
                      +20
                    </Button>
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-20 h-8 text-sm"
                        value={curPageInput}
                        onChange={(e) => setCurPageInput(e.target.value)}
                      />
                      <Button size="sm" variant="ghost" onClick={() => void setManualPage()}>
                        تطبيق
                      </Button>
                    </div>
                  </div>

                  {/* Relationships */}
                  <div className="rounded-xl border border-border/40 p-3 space-y-2 bg-surface2/15">
                    <div className="text-xs font-bold text-gold2">الروابط</div>
                    {linkedGoal ? (
                      <Link
                        href={`/goals/${linkedGoal.id}`}
                        className="block text-sm hover:text-gold2 transition-colors"
                      >
                        🎯 {linkedGoal.title}
                      </Link>
                    ) : (
                      <p className="text-xs text-text3">لا هدف مرتبط</p>
                    )}
                    {book.learningPath || book.readingPhase ? (
                      <Link href="/learning" className="block text-sm hover:text-gold2">
                        📚 {book.learningPath ?? `خطة القراءة — مرحلة ${book.readingPhase}`}
                      </Link>
                    ) : null}
                    <Link href="/learning" className="block text-sm hover:text-gold2">
                      🗺️ {book.relatedArea ?? "Learning"}
                    </Link>
                  </div>

                  {/* Analytics */}
                  {analytics && (
                    <div className="rounded-xl border border-border/40 p-4 space-y-3 bg-surface2/15">
                      <div className="text-xs font-bold text-gold2">تحليلات القراءة</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        {[
                          ["الجلسات", analytics.totalSessions],
                          ["الوقت", `${analytics.totalMinutes} د`],
                          ["السرعة", `${analytics.velocity} ص/يوم`],
                          ["الاتساق", `${analytics.consistencyScore}%`],
                        ].map(([l, v]) => (
                          <div key={l} className="p-2 rounded-lg bg-surface/50">
                            <div className="text-[10px] text-text3">{l}</div>
                            <div className="font-bold text-sm">{v}</div>
                          </div>
                        ))}
                      </div>
                      <LazyChart
                        data={analytics.dailyChart}
                        type="bar"
                        color="var(--sky)"
                        height={100}
                      />
                      <div className="text-[10px] text-text3">
                        سلسلة: {analytics.currentStreak} يوم · أطول: {analytics.longestStreak} · مساهمة
                        المعرفة: {analytics.knowledgeContribution}%
                      </div>
                    </div>
                  )}

                  {/* Sessions timeline */}
                  {analytics && (
                    <div className="space-y-2">
                      <Label>نشاط القراءة</Label>
                      {(
                        [
                          ["اليوم", analytics.timeline.today],
                          ["أمس", analytics.timeline.yesterday],
                          ["آخر أسبوع", analytics.timeline.lastWeek],
                          ["آخر شهر", analytics.timeline.lastMonth],
                        ] as const
                      ).map(([label, items]) =>
                        items.length ? (
                          <div key={label} className="text-xs">
                            <span className="text-gold2 font-bold">{label}</span>
                            <ul className="mt-1 space-y-0.5 text-text3">
                              {items.slice(0, 5).map((s) => (
                                <li key={s.id}>
                                  {s.date} — {s.pages} صفحة · {s.durationMin} د
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}

                  <div>
                    <Label>ملاحظات القراءة</Label>
                    <BookNotesEditor
                      value={notes}
                      onChange={setNotes}
                      saving={notesSaving}
                      lastSaved={lastSaved}
                    />
                  </div>
                </div>
              </div>
            </div>

            <footer className="shrink-0 sticky bottom-0 px-5 py-3 border-t border-white/5 bg-surface/90 backdrop-blur-md flex flex-wrap gap-2 justify-end">
              <Button
                variant="gold"
                size="sm"
                onClick={() => updateProgress(10)}
              >
                متابعة القراءة
              </Button>
              <Button variant="ghost" size="sm" onClick={() => book && onEdit(book)}>
                تعديل
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void markCompleted()}>
                إكمال
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void archiveBook()}>
                أرشفة
              </Button>
              <Button variant="danger" size="sm" onClick={() => void handleDelete()}>
                حذف
              </Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
