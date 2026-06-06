"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { commas, today, uid } from "@/lib/utils";
import type { Book, YearPayload } from "@/types/lifeos";

interface BooksViewProps {
  yearData: YearPayload;
  onRefresh: () => void;
}

type ReadingSession = {
  id: string;
  date: string;
  bookId: string;
  pages: number;
  durationMin: number;
};

export function BooksView({ yearData, onRefresh }: BooksViewProps) {
  const books = yearData.books ?? [];
  const sessions = (yearData.pomSessions as ReadingSession[] | undefined) ?? [];
  const [modal, setModal] = useState<null | "book" | "session">(null);
  const [form, setForm] = useState({ id: "", title: "", author: "", pages: "200" });
  const [sessionForm, setSessionForm] = useState({
    bookId: "",
    pages: "20",
    durationMin: "30",
    date: today(),
  });

  const done = books.filter((b) => b.status === "done").length;
  const reading = books.filter((b) => b.status === "reading").length;
  const goalProgress = Math.round((done / 12) * 100);
  const goal = 12;

  const analytics = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    const monthlySessions = sessions.filter((s) => s.date.startsWith(monthKey));
    const pagesThisMonth = monthlySessions.reduce((sum, s) => sum + s.pages, 0);
    const durationThisMonth = monthlySessions.reduce((sum, s) => sum + s.durationMin, 0);
    const byMonth: Record<string, number> = {};
    for (const s of sessions) {
      const month = s.date.slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + s.pages;
    }
    const chart = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);
    return { pagesThisMonth, durationThisMonth, chart };
  }, [sessions]);

  const readingStreak = useMemo(() => {
    const set = new Set(sessions.map((s) => s.date));
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().slice(0, 10);
      if (set.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (i === 0) {
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [sessions]);

  async function addOrUpdateBook() {
    if (!form.title.trim()) return;
    const id = form.id || uid();
    const book: Book = {
      id,
      title: form.title.trim(),
      author: form.author || undefined,
      pages: parseInt(form.pages, 10) || 200,
      curPage: form.id ? books.find((b) => b.id === form.id)?.curPage ?? 0 : 0,
      status: form.id ? books.find((b) => b.id === form.id)?.status ?? "planned" : "planned",
    };
    const nextBooks = books.some((b) => b.id === id)
      ? books.map((b) => (b.id === id ? book : b))
      : [...books, book];
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "book", payload: book }),
    });
    setForm({ id: "", title: "", author: "", pages: "200" });
    setModal(null);
    onRefresh();
  }

  async function updateProgress(id: string, delta: number) {
    const b = books.find((x) => x.id === id);
    if (!b) return;
    const cur = Math.max(0, Math.min(b.pages ?? 200, (b.curPage ?? 0) + delta));
    const status = cur >= (b.pages ?? 200) ? "done" : "reading";
    await fetch("/api/books", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, curPage: cur, status }),
    });
    onRefresh();
  }

  async function addSession() {
    const pages = parseInt(sessionForm.pages, 10);
    const durationMin = parseInt(sessionForm.durationMin, 10);
    if (!sessionForm.bookId || !pages) return;
    const session: ReadingSession = {
      id: uid(),
      date: sessionForm.date,
      bookId: sessionForm.bookId,
      pages,
      durationMin: durationMin || 0,
    };
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "session", payload: session }),
    });
    setSessionForm({ bookId: "", pages: "20", durationMin: "30", date: today() });
    setModal(null);
    onRefresh();
  }

  async function removeBook(id: string) {
    if (!confirm("حذف الكتاب؟")) return;
    await fetch(`/api/books?id=${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="📚 المكتبة"
        subtitle={`هدف السنة: ${goal} كتاب · ${done} مكتمل · سلسلة ${readingStreak} يوم`}
        actionLabel="+ كتاب"
        onAction={() => setModal("book")}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="مكتمل" value={String(done)} sub={`/${goal}`} color="var(--emerald)" />
        <KpiCard label="قيد القراءة" value={String(reading)} sub="" color="var(--sky)" />
        <KpiCard label="جلسات الشهر" value={String(sessions.filter((s) => s.date.startsWith(new Date().toISOString().slice(0, 7))).length)} sub="" color="var(--gold)" />
        <KpiCard label="التقدم السنوي" value={`${goalProgress}%`} sub="" color="var(--purple)" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-text3">صفحات هذا الشهر</div>
          <div className="text-2xl font-black text-gold2">{commas(analytics.pagesThisMonth)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text3">وقت القراءة</div>
          <div className="text-2xl font-black text-sky2">{commas(analytics.durationThisMonth)} دقيقة</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-text3">جلسات القراءة</div>
          <div className="text-2xl font-black text-emerald2">{sessions.length}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-gold2">📊 مخطط التقدم الشهري</div>
          <Button size="sm" variant="ghost" onClick={() => setModal("session")}>+ جلسة قراءة</Button>
        </div>
        <div className="space-y-2">
          {analytics.chart.map(([month, pages]) => (
            <div key={month}>
              <div className="flex justify-between text-xs mb-1">
                <span>{month}</span>
                <span>{commas(pages)} صفحة</span>
              </div>
              <div className="h-2 bg-surface2 rounded overflow-hidden">
                <div className="h-full bg-sky" style={{ width: `${Math.min(100, Math.round((pages / 500) * 100))}%` }} />
              </div>
            </div>
          ))}
          {!analytics.chart.length && <p className="text-sm text-text3">ابدأ بإضافة جلسات قراءة لعرض المخطط.</p>}
        </div>
      </Card>

      {books.length === 0 ? (
        <EmptyState icon="📚" title="مكتبتك فارغة" actionLabel="+ أول كتاب" onAction={() => setModal("book")} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {books.map((b) => {
            const pct = b.pages ? Math.round(((b.curPage ?? 0) / b.pages) * 100) : 0;
            return (
              <Card key={b.id} className="p-4">
                <div className="font-bold text-sm mb-1">{b.title}</div>
                {b.author && <div className="text-xs text-text3 mb-2">{b.author}</div>}
                <ProgressBar value={pct} color="var(--sky)" className="mb-2" />
                <div className="flex justify-between items-center text-xs text-text3">
                  <span>
                    {b.curPage ?? 0}/{b.pages} صفحة
                  </span>
                  <div className="flex gap-1 items-center">
                    <Button variant="ghost" size="sm" onClick={() => updateProgress(b.id, 10)}>
                      +10
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => updateProgress(b.id, 20)}>
                      +20
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setForm({ id: b.id, title: b.title, author: b.author ?? "", pages: String(b.pages ?? 200) }); setModal("book"); }}>
                      تعديل
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => removeBook(b.id)}>
                      حذف
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border2 rounded-[10px] w-full max-w-md p-6 space-y-4">
            {modal === "book" && (
              <>
                <h3 className="font-bold text-gold2">{form.id ? "تعديل كتاب" : "كتاب جديد"}</h3>
                <div>
                  <Label>العنوان</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>المؤلف</Label>
                  <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                </div>
                <div>
                  <Label>عدد الصفحات</Label>
                  <Input value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setModal(null)}>
                    إلغاء
                  </Button>
                  <Button variant="gold" onClick={addOrUpdateBook}>
                    حفظ
                  </Button>
                </div>
              </>
            )}

            {modal === "session" && (
              <>
                <h3 className="font-bold text-gold2">جلسة قراءة جديدة</h3>
                <div>
                  <Label>الكتاب</Label>
                  <select className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm" value={sessionForm.bookId} onChange={(e) => setSessionForm({ ...sessionForm, bookId: e.target.value })}>
                    <option value="">اختر كتاب</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>التاريخ</Label>
                  <Input type="date" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} />
                </div>
                <div>
                  <Label>صفحات مقروءة</Label>
                  <Input value={sessionForm.pages} onChange={(e) => setSessionForm({ ...sessionForm, pages: e.target.value })} />
                </div>
                <div>
                  <Label>المدة (دقيقة)</Label>
                  <Input value={sessionForm.durationMin} onChange={(e) => setSessionForm({ ...sessionForm, durationMin: e.target.value })} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setModal(null)}>
                    إلغاء
                  </Button>
                  <Button variant="gold" onClick={addSession}>
                    حفظ الجلسة
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
