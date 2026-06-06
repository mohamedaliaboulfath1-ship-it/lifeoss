import { calcGoalPct, calcOverallHabitPct } from "@/lib/calculations";
import type { YearPayload } from "@/types/lifeos";

export interface HabitCorrelation {
  habitName: string;
  consistency: number;
  impact: "high" | "medium" | "low";
}

export interface GoalForecast {
  id: string;
  title: string;
  progress: number;
  expectedByYearEnd: number;
  atRisk: boolean;
}

export interface WeightForecast {
  current: number | null;
  predicted30d: number | null;
  trendPerWeek: number;
}

export interface AnalyticsTrend {
  id: string;
  label: string;
  direction: "up" | "down" | "stable";
  value: string;
}

export interface AtRiskItem {
  id: string;
  area: "goals" | "finance" | "health" | "learning";
  title: string;
  reason: string;
}

export interface ExecutiveInsight {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
}

export interface AnalyticsResult {
  habitCorrelations: HabitCorrelation[];
  goalForecasts: GoalForecast[];
  weightForecast: WeightForecast;
  learningScore: number;
  financeScore: number;
  lifeScore: number;
  lifeScoreBreakdown: Array<{ label: string; score: number }>;
  trends: AnalyticsTrend[];
  atRisk: AtRiskItem[];
  executiveInsights: ExecutiveInsight[];
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function calculateWeightForecast(yearData: YearPayload): WeightForecast {
  const logs = [...(yearData.weightLogs ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  if (logs.length < 2) {
    return {
      current: logs.at(-1)?.weight ?? null,
      predicted30d: logs.at(-1)?.weight ?? null,
      trendPerWeek: 0,
    };
  }

  const first = logs[0];
  const last = logs.at(-1)!;
  const dayMs = 24 * 60 * 60 * 1000;
  const elapsedDays = Math.max(
    1,
    Math.round(
      (new Date(last.date).getTime() - new Date(first.date).getTime()) / dayMs
    )
  );
  const delta = last.weight - first.weight;
  const perDay = delta / elapsedDays;
  const perWeek = perDay * 7;
  return {
    current: last.weight,
    predicted30d: Number((last.weight + perDay * 30).toFixed(1)),
    trendPerWeek: Number(perWeek.toFixed(2)),
  };
}

function calculateHabitCorrelations(yearData: YearPayload): HabitCorrelation[] {
  const habits = yearData.habits ?? [];
  const logs = yearData.habitLogs ?? {};
  return habits
    .slice(0, 6)
    .map((habit) => {
      const dates = Object.keys(logs[habit.id] ?? {});
      const done = dates.filter((d) => logs[habit.id]?.[d]).length;
      const consistency = dates.length ? Math.round((done / dates.length) * 100) : 0;
      const impact: HabitCorrelation["impact"] =
        consistency >= 70 ? "high" : consistency >= 40 ? "medium" : "low";
      return { habitName: habit.name, consistency, impact };
    })
    .sort((a, b) => b.consistency - a.consistency);
}

function calculateGoalForecasts(yearData: YearPayload): GoalForecast[] {
  const now = new Date();
  const daysLeftInYear = Math.max(
    1,
    Math.ceil(
      (new Date(now.getFullYear(), 11, 31).getTime() - now.getTime()) /
        (24 * 60 * 60 * 1000)
    )
  );

  return (yearData.goals ?? []).slice(0, 8).map((goal) => {
    const progress = goal.progress ?? calcGoalPct(goal);
    const dueDate = goal.due ? new Date(goal.due) : null;
    const daysLeft = dueDate
      ? Math.max(
          1,
          Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        )
      : daysLeftInYear;
    const velocity = progress / Math.max(1, 365 - daysLeftInYear);
    const expectedByYearEnd = clampScore(progress + velocity * daysLeftInYear);
    const atRisk = progress < 60 && daysLeft < 90;
    return {
      id: goal.id,
      title: goal.title,
      progress,
      expectedByYearEnd,
      atRisk,
    };
  });
}

function calculateLearningScore(yearData: YearPayload) {
  const doneBooks = (yearData.books ?? []).filter((b) => b.status === "done").length;
  const readingBooks = (yearData.books ?? []).filter((b) => b.status === "reading").length;
  const pagesRead = (yearData.books ?? []).reduce((sum, b) => sum + (b.curPage ?? 0), 0);
  return clampScore(doneBooks * 7 + readingBooks * 4 + pagesRead / 25);
}

function calculateFinanceScore(yearData: YearPayload) {
  const txs = yearData.transactions ?? [];
  const income = txs
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = txs
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const savings = txs
    .filter((t) => t.type === "saving")
    .reduce((sum, t) => sum + t.amount, 0);
  const debtsRemaining = (yearData.debts ?? []).reduce(
    (sum, d) => sum + Math.max(0, d.total - d.paid),
    0
  );
  const savingsRatio = income > 0 ? (savings / income) * 100 : 0;
  const expenseRatio = income > 0 ? (expense / income) * 100 : 100;
  return clampScore(60 + savingsRatio - expenseRatio * 0.25 - debtsRemaining / 3000);
}

function detectTrends(yearData: YearPayload): AnalyticsTrend[] {
  const habitsPct = calcOverallHabitPct(yearData);
  const goalsAvg = (yearData.goals ?? []).length
    ? Math.round(
        (yearData.goals ?? []).reduce((sum, g) => sum + (g.progress ?? calcGoalPct(g)), 0) /
          (yearData.goals ?? []).length
      )
    : 0;
  const weight = calculateWeightForecast(yearData);
  return [
    {
      id: "habits",
      label: "انضباط العادات",
      direction: habitsPct >= 70 ? "up" : habitsPct >= 45 ? "stable" : "down",
      value: `${habitsPct}%`,
    },
    {
      id: "goals",
      label: "تقدّم الأهداف",
      direction: goalsAvg >= 60 ? "up" : goalsAvg >= 35 ? "stable" : "down",
      value: `${goalsAvg}%`,
    },
    {
      id: "weight",
      label: "اتجاه الوزن",
      direction:
        Math.abs(weight.trendPerWeek) < 0.2
          ? "stable"
          : weight.trendPerWeek > 0
            ? "up"
            : "down",
      value: `${weight.trendPerWeek > 0 ? "+" : ""}${weight.trendPerWeek} كجم/أسبوع`,
    },
  ];
}

function detectAtRisk(yearData: YearPayload, financeScore: number): AtRiskItem[] {
  const risk: AtRiskItem[] = [];
  const goals = calculateGoalForecasts(yearData).filter((g) => g.atRisk);
  for (const g of goals.slice(0, 3)) {
    risk.push({
      id: `goal-${g.id}`,
      area: "goals",
      title: g.title,
      reason: "الهدف متأخر وقد لا يلحق الموعد الحالي",
    });
  }

  if (financeScore < 50) {
    risk.push({
      id: "finance-score",
      area: "finance",
      title: "الصحة المالية",
      reason: "معدل المصروف أعلى من المطلوب مقارنة بالدخل",
    });
  }

  const doneBooks = (yearData.books ?? []).filter((b) => b.status === "done").length;
  if (doneBooks < 5 && new Date().getMonth() >= 7) {
    risk.push({
      id: "learning-goal",
      area: "learning",
      title: "هدف القراءة السنوي",
      reason: "أقل من نصف الهدف السنوي حتى الآن",
    });
  }

  const habits = calcOverallHabitPct(yearData);
  if (habits < 45) {
    risk.push({
      id: "habits-discipline",
      area: "health",
      title: "الانضباط اليومي",
      reason: "الالتزام بالعادات منخفض ويؤثر على التقدم العام",
    });
  }

  return risk;
}

function buildExecutiveInsights(
  lifeScore: number,
  financeScore: number,
  learningScore: number,
  atRisk: AtRiskItem[]
): ExecutiveInsight[] {
  const insights: ExecutiveInsight[] = [];

  if (lifeScore >= 75) {
    insights.push({
      title: "أداء عام قوي",
      detail: "التحركات الحالية متوازنة بين الانضباط، التعلّم، والمال.",
      priority: "low",
    });
  } else if (lifeScore >= 55) {
    insights.push({
      title: "أداء متوسط يحتاج تحسين",
      detail: "النتيجة جيدة لكن ما زال هناك مجالات متأخرة تحتاج متابعة أسبوعية.",
      priority: "medium",
    });
  } else {
    insights.push({
      title: "انخفاض في مؤشر الحياة",
      detail: "هناك فجوة واضحة بين الأهداف والتنفيذ اليومي، يلزم خطة تصحيح.",
      priority: "high",
    });
  }

  if (financeScore < 55) {
    insights.push({
      title: "أولوية مالية",
      detail: "خفض المصروف الشهري ورفع الادخار سيؤثر مباشرة على الاستقرار.",
      priority: "high",
    });
  }

  if (learningScore < 50) {
    insights.push({
      title: "نمو التعلم بطيء",
      detail: "زيادة جلسات القراءة الأسبوعية سترفع التقدم بشكل سريع.",
      priority: "medium",
    });
  }

  if (atRisk.length > 0) {
    insights.push({
      title: "عناصر معرضة للخطر",
      detail: `تم رصد ${atRisk.length} عنصر يحتاج تدخل في هذا الأسبوع.`,
      priority: "high",
    });
  }

  return insights.slice(0, 5);
}

export function runAnalyticsEngine(yearData: YearPayload): AnalyticsResult {
  const habitCorrelations = calculateHabitCorrelations(yearData);
  const goalForecasts = calculateGoalForecasts(yearData);
  const weightForecast = calculateWeightForecast(yearData);
  const learningScore = calculateLearningScore(yearData);
  const financeScore = calculateFinanceScore(yearData);
  const habitsScore = clampScore(calcOverallHabitPct(yearData));
  const goalsScore = clampScore(
    (yearData.goals ?? []).length
      ? (yearData.goals ?? []).reduce(
          (sum, g) => sum + (g.progress ?? calcGoalPct(g)),
          0
        ) / (yearData.goals ?? []).length
      : 0
  );
  const healthScore = clampScore(50 + Math.max(-20, Math.min(20, -weightForecast.trendPerWeek * 10)));

  const lifeScoreBreakdown = [
    { label: "الانضباط", score: habitsScore },
    { label: "الأهداف", score: goalsScore },
    { label: "المال", score: financeScore },
    { label: "التعلّم", score: learningScore },
    { label: "الصحة", score: healthScore },
  ];
  const lifeScore = clampScore(
    lifeScoreBreakdown.reduce((sum, item) => sum + item.score, 0) /
      lifeScoreBreakdown.length
  );

  const trends = detectTrends(yearData);
  const atRisk = detectAtRisk(yearData, financeScore);
  const executiveInsights = buildExecutiveInsights(
    lifeScore,
    financeScore,
    learningScore,
    atRisk
  );

  return {
    habitCorrelations,
    goalForecasts,
    weightForecast,
    learningScore,
    financeScore,
    lifeScore,
    lifeScoreBreakdown,
    trends,
    atRisk,
    executiveInsights,
  };
}
