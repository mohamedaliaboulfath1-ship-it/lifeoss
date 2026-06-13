import type { Book } from "@/types/lifeos";

export type BookSession = {
  id: string;
  date: string;
  bookId: string;
  pages: number;
  durationMin: number;
};

export type BookAnalytics = {
  totalSessions: number;
  totalPages: number;
  totalMinutes: number;
  avgPagesPerDay: number;
  currentStreak: number;
  longestStreak: number;
  velocity: number;
  estimatedFinishDate: string | null;
  consistencyScore: number;
  knowledgeContribution: number;
  dailyChart: Array<{ label: string; value: number }>;
  timeline: {
    today: BookSession[];
    yesterday: BookSession[];
    lastWeek: BookSession[];
    lastMonth: BookSession[];
  };
};

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

export function computeBookAnalytics(
  book: Book,
  sessions: BookSession[]
): BookAnalytics {
  const bookSessions = sessions
    .filter((s) => s.bookId === book.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPages = bookSessions.reduce((a, s) => a + s.pages, 0);
  const totalMinutes = bookSessions.reduce((a, s) => a + s.durationMin, 0);
  const totalSessions = bookSessions.length;

  const today = dateKey(new Date());
  const yesterday = daysAgo(1);
  const weekAgo = daysAgo(7);
  const monthAgo = daysAgo(30);

  const pagesByDate = new Map<string, number>();
  for (const s of bookSessions) {
    pagesByDate.set(s.date, (pagesByDate.get(s.date) ?? 0) + s.pages);
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = dateKey(d);
    return {
      label: d.toLocaleDateString("ar-SA", { weekday: "short" }),
      value: pagesByDate.get(key) ?? 0,
    };
  });

  const pagesLast7 = last7Days.reduce((a, d) => a + d.value, 0);
  const velocity = Math.round((pagesLast7 / 7) * 10) / 10;
  const activeDays = [...pagesByDate.keys()].filter((d) => d >= monthAgo).length;
  const consistencyScore = Math.min(100, Math.round((activeDays / 30) * 100));

  const remaining = Math.max(0, (book.pages ?? 0) - (book.curPage ?? 0));
  let estimatedFinishDate: string | null = null;
  if (remaining > 0 && velocity > 0) {
    const daysNeeded = Math.ceil(remaining / velocity);
    const finish = new Date();
    finish.setDate(finish.getDate() + daysNeeded);
    estimatedFinishDate = finish.toISOString().slice(0, 10);
  } else if (remaining === 0) {
    estimatedFinishDate = book.finishDate ?? today;
  }

  const sortedDates = [...new Set(bookSessions.map((s) => s.date))].sort();
  let longestStreak = 0;
  let streak = 0;
  if (sortedDates.length) {
    const set = new Set(sortedDates);
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const key = dateKey(cursor);
      if (set.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (i === 0) {
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    let run = 0;
    let prev: string | null = null;
    for (const d of sortedDates) {
      if (!prev) {
        run = 1;
      } else {
        const diff =
          (new Date(d).getTime() - new Date(prev).getTime()) / (1000 * 60 * 60 * 24);
        run = diff === 1 ? run + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, run);
      prev = d;
    }
  }

  const daysWithReading = pagesByDate.size || 1;
  const avgPagesPerDay = Math.round(totalPages / daysWithReading);

  const progressPct = book.progressPct ?? 0;
  const knowledgeContribution = Math.min(100, Math.round(progressPct * 0.4 + consistencyScore * 0.2));

  return {
    totalSessions,
    totalPages,
    totalMinutes,
    avgPagesPerDay,
    currentStreak: streak,
    longestStreak,
    velocity,
    estimatedFinishDate,
    consistencyScore,
    knowledgeContribution,
    dailyChart: last7Days,
    timeline: {
      today: bookSessions.filter((s) => s.date === today),
      yesterday: bookSessions.filter((s) => s.date === yesterday),
      lastWeek: bookSessions.filter((s) => s.date >= weekAgo && s.date < today),
      lastMonth: bookSessions.filter((s) => s.date >= monthAgo && s.date < weekAgo),
    },
  };
}
