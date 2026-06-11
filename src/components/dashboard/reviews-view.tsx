"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { uid } from "@/lib/utils";
import type { YearPayload } from "@/types/lifeos";
import { RemotionRecapSection } from "@/components/reviews/remotion-recap-section";

interface ReviewsViewProps {
  yearData: YearPayload;
  onSave?: (data: YearPayload) => Promise<void>;
}

type ReviewTab = "daily" | "weekly" | "monthly" | "quarterly" | "annual";

type DailyEntry = {
  id: string;
  date: string;
  mood?: number;
  energy?: number;
  gratitudes?: string;
  wins?: string;
  lesson?: string;
  tomorrowPlan?: string;
  note?: string;
};

type ApiReview = {
  id: string;
  date: string;
  period: "weekly" | "monthly" | "quarterly" | "annual";
  title: string;
  wins?: string;
  challenges?: string;
  lessons?: string;
  nextFocus?: string;
  summary?: string;
};

export function ReviewsView({ yearData }: ReviewsViewProps) {
  const [tab, setTab] = useState<ReviewTab>("daily");
  const [apiDaily, setApiDaily] = useState<DailyEntry[]>([]);
  const [apiReviews, setApiReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const fallbackReviews: ApiReview[] = (yearData.reviews ?? []).map((r, index) => ({
    id: r.id,
    date: new Date().toISOString().slice(0, 10),
    title: r.period || `مراجعة ${index + 1}`,
    period: r.type === "quarterly" ? "quarterly" : (r.type as "weekly" | "monthly"),
    wins: r.wins,
    challenges: r.challenges,
    lessons: r.lessons,
    nextFocus: r.nextFocus,
  }));
  const fallbackDaily: DailyEntry[] = (yearData.dailyJournals ?? []).map((j) => ({
    id: j.id,
    date: j.date,
    mood: j.mood,
    energy: j.energy,
    note: j.note,
  }));

  const reviews = apiReviews.length ? apiReviews : fallbackReviews;
  const journals = apiDaily.length ? apiDaily : fallbackDaily;
  const filtered = reviews.filter((r) => r.period === tab);
  const [form, setForm] = useState({
    wins: "",
    challenges: "",
    lessons: "",
    nextFocus: "",
    note: "",
    mood: "3",
    energy: "3",
  });

  useEffect(() => {
    let cancelled = false;
    async function loadReviews() {
      setLoading(true);
      const res = await fetch("/api/reviews?type=all");
      const json = await res.json().catch(() => ({}));
      if (!cancelled && res.ok) {
        setApiDaily((json.daily as DailyEntry[]) ?? []);
        const mapped = ((json.reviews as Array<Record<string, unknown>>) ?? []).map((r) => ({
          id: String(r.id),
          date: String(r.date),
          title:
            (r.period as string) === "monthly"
              ? new Date(String(r.date)).toLocaleDateString("ar-SA", { month: "long", year: "numeric" })
              : new Date(String(r.date)).toLocaleDateString("ar-SA", { month: "long", day: "numeric" }),
          period:
            (r.period as "weekly" | "monthly" | "quarterly" | "annual") ?? "weekly",
          wins: (r.wins as string) ?? "",
          challenges: (r.challenges as string) ?? "",
          lessons: (r.lessons as string) ?? "",
          nextFocus: (r.nextFocus as string) ?? "",
          summary: (r.summary as string) ?? "",
        }));
        setApiReviews(mapped);
      }
      if (!cancelled) setLoading(false);
    }
    loadReviews();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const totalReviews = reviews.length;
    const totalJournals = journals.length;
    const moodAvg = journals.length
      ? (
          journals.reduce((sum, j) => sum + (j.mood ?? 3), 0) /
          journals.length
        ).toFixed(1)
      : "0";
    const topPattern = totalReviews > 0 ? "الاستمرارية تتحسن مع المراجعة الأسبوعية." : "ابدأ أول مراجعة للحصول على ملخص.";
    return { totalReviews, totalJournals, moodAvg, topPattern };
  }, [reviews, journals]);

  function generateRuleSummary(payload: {
    wins?: string;
    challenges?: string;
    lessons?: string;
    nextFocus?: string;
    mood?: number;
  }) {
    const points: string[] = [];
    if (payload.wins) points.push("✅ لديك إنجازات واضحة تستحق التثبيت.");
    if (payload.challenges) points.push("⚠️ التحديات الحالية تحتاج خطة تنفيذ أدق.");
    if (payload.lessons) points.push("💡 الدروس المستفادة تشير لتحسن الوعي.");
    if (payload.nextFocus) points.push("🎯 التركيز القادم محدد وقابل للمتابعة.");
    if ((payload.mood ?? 3) <= 2) points.push("🧠 الحالة المزاجية منخفضة؛ يفضل تخفيف الحمل.");
    if (!points.length) points.push("ابدأ بتعبئة الحقول للحصول على ملخص ذكي.");
    return points.join(" ");
  }

  async function saveReview() {
    const now = new Date();
    const period = now.toLocaleDateString("ar-SA", {
      month: "long",
      year: "numeric",
    });

    if (tab === "daily") {
      const entry: DailyEntry = {
        id: uid(),
        date: now.toISOString().slice(0, 10),
        mood: parseInt(form.mood, 10),
        energy: parseInt(form.energy, 10),
        note: [form.note, form.wins, form.lessons].filter(Boolean).join(" | "),
      };
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "daily",
          payload: {
            id: entry.id,
            date: entry.date,
            mood: entry.mood,
            energy: entry.energy,
            note: entry.note,
            wins: form.wins,
            lesson: form.lessons,
          },
        }),
      });
      setApiDaily((prev) => [entry, ...prev]);
      setForm({ wins: "", challenges: "", lessons: "", nextFocus: "", note: "", mood: "3", energy: "3" });
      return;
    }

    const review = {
      id: uid(),
      title: period,
      date: now.toISOString().slice(0, 10),
      period: tab,
      wins: form.wins,
      challenges: form.challenges,
      lessons: form.lessons,
      nextFocus: form.nextFocus,
    };
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: tab === "annual" ? "annual" : tab,
        payload: {
          id: review.id,
          date: review.date,
          period: review.period,
          wins: review.wins,
          challenges: review.challenges,
          lessons: review.lessons,
          nextFocus: review.nextFocus,
          summary: generateRuleSummary({
            wins: review.wins,
            challenges: review.challenges,
            lessons: review.lessons,
            nextFocus: review.nextFocus,
          }),
        },
      }),
    });
    setApiReviews((prev) => [
      ...prev,
      {
        id: review.id,
        date: review.date,
        title: review.title,
        period: review.period,
        wins: review.wins,
        challenges: review.challenges,
        lessons: review.lessons,
        nextFocus: review.nextFocus,
        summary: generateRuleSummary({
          wins: review.wins,
          challenges: review.challenges,
          lessons: review.lessons,
          nextFocus: review.nextFocus,
        }),
      },
    ]);
    setForm({ wins: "", challenges: "", lessons: "", nextFocus: "", note: "", mood: "3", energy: "3" });
  }

  async function removeEntry(type: "daily" | "weekly" | "monthly" | "quarterly" | "annual", id: string) {
    if (!confirm("حذف المراجعة؟")) return;
    await fetch(`/api/reviews?type=${type}&id=${id}`, { method: "DELETE" });
    if (type === "daily") setApiDaily((prev) => prev.filter((p) => p.id !== id));
    else setApiReviews((prev) => prev.filter((p) => p.id !== id));
  }

  const booksDone = (yearData.books ?? []).filter((b) => b.status === "done").length;
  const goalsDone = (yearData.goals ?? []).filter((g) => g.done || g.status === "done").length;
  const habitCompletions = Object.values(yearData.habitLogs ?? {}).reduce(
    (sum, day) => sum + Object.values(day).filter(Boolean).length,
    0
  );
  const recapData = {
    lifeScore: 72,
    habitsPct: journals.length ? Math.min(100, journals.length * 10) : 65,
    workouts: yearData.workoutLogs?.length ?? 0,
    goalsDone,
    learningHours: Math.round((yearData.pomSessions?.length ?? 0) * 0.5),
    topWin: filtered[0]?.wins ?? "استمرار الالتزام اليومي",
    topRisk: filtered[0]?.challenges ?? "لا مخاطر مسجّلة",
    opportunity: filtered[0]?.nextFocus ?? "تعزيز التعلم",
    year: new Date().getFullYear().toString(),
    habitsCompleted: habitCompletions,
    booksRead: booksDone,
    weightDelta: 3,
    savingsTotal: 0,
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {(tab === "weekly" || tab === "monthly" || tab === "annual") && (
        <RemotionRecapSection data={recapData} />
      )}
      <PageHeader title="📔 المراجعات" subtitle="تعلّم من أسبوعك وشهرك" />

      <Tabs
        tabs={[
          { id: "daily", label: "يومية" },
          { id: "weekly", label: "أسبوعية" },
          { id: "monthly", label: "شهرية" },
          { id: "quarterly", label: "ربع سنوية" },
          { id: "annual", label: "سنوية" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as ReviewTab)}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-black text-gold2">{summary.totalJournals}</div>
          <div className="text-xs text-text3">يوميات مكتوبة</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-black text-sky2">{summary.totalReviews}</div>
          <div className="text-xs text-text3">مراجعات دورية</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-black text-emerald2">{summary.moodAvg}</div>
          <div className="text-xs text-text3">متوسط المزاج</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm font-bold text-purple2">{summary.topPattern}</div>
          <div className="text-xs text-text3">نمط انعكاس</div>
        </Card>
      </div>

      <Card className="p-4 space-y-3">
        {tab === "daily" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>المزاج (1-5)</Label>
                <Input value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })} />
              </div>
              <div>
                <Label>الطاقة (1-5)</Label>
                <Input value={form.energy} onChange={(e) => setForm({ ...form, energy: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>ماذا حصل اليوم؟</Label>
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </>
        ) : (
          <>
            <div>
              <Label>إنجازات هذه الفترة</Label>
              <Input value={form.wins} onChange={(e) => setForm({ ...form, wins: e.target.value })} />
            </div>
            <div>
              <Label>تحديات</Label>
              <Input value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} />
            </div>
            <div>
              <Label>دروس مستفادة</Label>
              <Input value={form.lessons} onChange={(e) => setForm({ ...form, lessons: e.target.value })} />
            </div>
            <div>
              <Label>تركيز الفترة القادمة</Label>
              <Input value={form.nextFocus} onChange={(e) => setForm({ ...form, nextFocus: e.target.value })} />
            </div>
          </>
        )}
        <Button variant="gold" onClick={saveReview}>
          حفظ المراجعة
        </Button>
      </Card>

      <Card className="p-4">
        <div className="font-bold text-gold2 mb-2">🧠 ملخص تلقائي (Rule-based)</div>
        <p className="text-sm text-text2">
          {generateRuleSummary({
            wins: form.wins,
            challenges: form.challenges,
            lessons: form.lessons,
            nextFocus: form.nextFocus,
            mood: parseInt(form.mood, 10),
          })}
        </p>
      </Card>

      {tab === "daily" && (
        <div className="space-y-3">
          {journals
            .slice()
            .reverse()
            .slice(0, 10)
            .map((j) => (
              <Card key={j.id} className="p-4 text-sm space-y-1">
                <div className="font-bold text-gold2">{j.date}</div>
                <p>🙂 المزاج: {j.mood ?? "-"}</p>
                <p>⚡ الطاقة: {j.energy ?? "-"}</p>
                {j.note && <p>📝 {j.note}</p>}
                <div className="flex justify-end">
                  <Button size="sm" variant="danger" onClick={() => removeEntry("daily", j.id)}>حذف</Button>
                </div>
              </Card>
            ))}
        </div>
      )}

      {filtered.map((r) => (
        <Card key={r.id} className="p-4 text-sm space-y-2">
          <div className="font-bold text-gold2">{r.title}</div>
          {r.wins && <p>✅ {r.wins}</p>}
          {r.challenges && <p>⚠️ {r.challenges}</p>}
          {r.lessons && <p>💡 {r.lessons}</p>}
          {r.nextFocus && <p>🎯 {r.nextFocus}</p>}
          {r.summary && <p className="text-text3 text-xs">🧠 {r.summary}</p>}
          <div className="flex justify-end">
            <Button size="sm" variant="danger" onClick={() => removeEntry(r.period, r.id)}>حذف</Button>
          </div>
        </Card>
      ))}

      {loading && <Card className="p-4 text-sm text-text3">جاري تحميل المراجعات...</Card>}
    </div>
  );
}
