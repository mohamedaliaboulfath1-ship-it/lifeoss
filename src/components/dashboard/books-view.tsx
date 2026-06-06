"use client";

import { useMemo, useState } from "react";
import { MotionCard, MotionModal } from "@/components/motion/motion";
import { BOOK_TYPE_LABELS } from "@/lib/icons";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { commas, today, uid } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/contexts/toast-context";
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

type BookExt = Book & {
  bookType?: string;
  category?: string;
  coverUrl?: string;
  rating?: number;
};

export function BooksView({ yearData, onRefresh }: BooksViewProps) {
  const { toast } = useToast();
  const books = (yearData.books ?? []) as BookExt[];
  const sessions = (yearData.pomSessions as ReadingSession[] | undefined) ?? [];
  const [view, setView] = useState("gallery");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<null | "book" | "session">(null);
  const [form, setForm] = useState({
    id: "",
    title: "",
    author: "",
    pages: "200",
    bookType: "physical",
    category: "",
    notes: "",
    coverPath: "",
  });
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

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((b) => {
      if (typeFilter !== "all" && (b as BookExt).bookType !== typeFilter) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${b.title} ${b.author ?? ""} ${(b as BookExt).category ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [books, query, typeFilter, statusFilter]);

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

  async function uploadCover(bookId: string, file: File) {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return "";
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${uid}/${bookId}.${ext}`;
    const { error } = await supabase.storage
      .from("book-covers")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast("فشل رفع الغلاف", "error");
      return "";
    }
    return path;
  }

  async function addOrUpdateBook() {
    if (!form.title.trim()) return;
    const id = form.id || uid();
    const payload = {
      id,
      title: form.title.trim(),
      author: form.author || undefined,
      pages: parseInt(form.pages, 10) || 200,
      curPage: form.id ? books.find((b) => b.id === form.id)?.curPage ?? 0 : 0,
      status: form.id ? books.find((b) => b.id === form.id)?.status ?? "planned" : "planned",
      bookType: form.bookType,
      category: form.category || undefined,
      notes: form.notes || undefined,
      coverPath: form.coverPath || undefined,
    };
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "book", payload }),
    });
    setForm({
      id: "",
      title: "",
      author: "",
      pages: "200",
      bookType: "physical",
      category: "",
      notes: "",
      coverPath: "",
    });
    setModal(null);
    onRefresh();
    toast("تم حفظ الكتاب", "success");
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

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <Input
          placeholder="بحث في المكتبة..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">كل الأنواع</option>
          {Object.entries(BOOK_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">كل الحالات</option>
          <option value="planned">مخطط</option>
          <option value="reading">قيد القراءة</option>
          <option value="done">مكتمل</option>
        </select>
      </div>

      <Tabs
        tabs={[
          { id: "gallery", label: "🖼️ معرض" },
          { id: "list", label: "📋 قائمة" },
          { id: "progress", label: "📈 التقدم" },
        ]}
        active={view}
        onChange={setView}
      />

      {filteredBooks.length === 0 ? (
        <EmptyState icon="📚" title="مكتبتك فارغة" actionLabel="+ أول كتاب" onAction={() => setModal("book")} />
      ) : view === "gallery" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBooks.map((b) => {
            const pct = b.pages ? Math.round(((b.curPage ?? 0) / b.pages) * 100) : 0;
            const ext = b as BookExt;
            return (
              <MotionCard key={b.id} className="border border-border rounded-[10px] overflow-hidden bg-surface">
                <div className="aspect-[3/4] bg-gradient-to-br from-surface2 to-surface flex items-center justify-center text-4xl">
                  {ext.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ext.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    "📖"
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <div className="font-bold text-sm truncate">{b.title}</div>
                  <div className="text-[10px] text-text3">
                    {BOOK_TYPE_LABELS[ext.bookType ?? "physical"] ?? "كتاب"} · {b.status}
                  </div>
                  <ProgressBar value={pct} color="var(--sky)" />
                  <div className="flex gap-1 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => updateProgress(b.id, 10)}>+10</Button>
                    <Button variant="danger" size="sm" onClick={() => removeBook(b.id)}>🗑</Button>
                  </div>
                </div>
              </MotionCard>
            );
          })}
        </div>
      ) : view === "list" ? (
        <div className="space-y-2">
          {filteredBooks.map((b) => {
            const pct = b.pages ? Math.round(((b.curPage ?? 0) / b.pages) * 100) : 0;
            return (
              <Card key={b.id} className="p-3 flex items-center gap-4">
                <div className="w-10 h-14 bg-surface2 rounded flex items-center justify-center shrink-0">📖</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{b.title}</div>
                  <div className="text-xs text-text3">{b.author} · {pct}%</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => updateProgress(b.id, 10)}>+10</Button>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredBooks.map((b) => {
            const pct = b.pages ? Math.round(((b.curPage ?? 0) / b.pages) * 100) : 0;
            return (
              <Card key={b.id} className="p-4">
                <div className="font-bold text-sm mb-1">{b.title}</div>
                {b.author && <div className="text-xs text-text3 mb-2">{b.author}</div>}
                <ProgressBar value={pct} color="var(--sky)" className="mb-2" />
                <div className="flex justify-between items-center text-xs text-text3">
                  <span>{b.curPage ?? 0}/{b.pages} صفحة</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => updateProgress(b.id, 10)}>+10</Button>
                    <Button variant="ghost" size="sm" onClick={() => updateProgress(b.id, 20)}>+20</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <MotionModal open={!!modal} onClose={() => setModal(null)}>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>عدد الصفحات</Label>
                    <Input value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
                  </div>
                  <div>
                    <Label>نوع الكتاب</Label>
                    <select
                      className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
                      value={form.bookType}
                      onChange={(e) => setForm({ ...form, bookType: e.target.value })}
                    >
                      {Object.entries(BOOK_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>التصنيف</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div>
                  <Label>ملاحظات</Label>
                  <textarea
                    className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm min-h-[60px]"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <div>
                  <Label>صورة الغلاف</Label>
                  <input
                    type="file"
                    accept="image/*"
                    className="text-xs text-text3"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      const bookId = form.id || uid();
                      if (!f) return;
                      const path = await uploadCover(bookId, f);
                      if (path) {
                        setForm((prev) => ({ ...prev, id: bookId, coverPath: path }));
                        toast("تم رفع الغلاف", "success");
                      }
                    }}
                  />
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
      </MotionModal>
    </div>
  );
}
