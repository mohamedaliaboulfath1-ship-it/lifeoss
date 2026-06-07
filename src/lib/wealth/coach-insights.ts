import type { DashboardInsight } from "@/types/lifeos-pro";
import type { WealthSnapshot } from "@/types/wealth";

const WEALTH_ICONS: Record<string, string> = {
  "low-savings-rate": "💰",
  "high-subscriptions": "📱",
  "debt-exceeds-savings": "🏦",
  "sub-renewal": "🔔",
};

export function wealthCoachToDashboardInsights(
  insights: WealthSnapshot["coachInsights"]
): DashboardInsight[] {
  return insights.map((i) => ({
    id: i.id,
    icon: WEALTH_ICONS[i.id] ?? (i.id.startsWith("budget-") ? "📊" : "💰"),
    message: i.message,
    action: i.action,
    actionUrl: i.actionUrl,
    priority: i.priority as DashboardInsight["priority"],
  }));
}

export function buildWealthCoachInsights(data: {
  savingsRate: number;
  subscriptionMonthly: number;
  monthlyIncome: number;
  debts: number;
  savings: number;
  budgetAlerts: WealthSnapshot["budgetAlerts"];
  nearestRenewal?: WealthSnapshot["nearestRenewal"];
}) {
  const insights: WealthSnapshot["coachInsights"] = [];

  if (data.monthlyIncome > 0 && data.savingsRate < 10) {
    insights.push({
      id: "low-savings-rate",
      message: `معدل ادخارك ${data.savingsRate}% — الهدف المثالي 20%+`,
      action: "راجع الميزانية",
      actionUrl: "/finance",
      priority: "high",
    });
  }

  if (data.monthlyIncome > 0 && data.subscriptionMonthly / data.monthlyIncome > 0.15) {
    insights.push({
      id: "high-subscriptions",
      message: `الاشتراكات تمثل ${Math.round((data.subscriptionMonthly / data.monthlyIncome) * 100)}% من دخلك`,
      action: "راجع الاشتراكات",
      actionUrl: "/finance",
      priority: "high",
    });
  }

  if (data.debts > data.savings && data.debts > 0) {
    insights.push({
      id: "debt-exceeds-savings",
      message: "ديونك أعلى من مدخراتك — أولوية السداد",
      action: "خطة سداد",
      actionUrl: "/finance",
      priority: "urgent",
    });
  }

  for (const a of data.budgetAlerts.filter((b) => b.level === "exceeded" || b.level === "critical")) {
    insights.push({
      id: `budget-${a.category}`,
      message:
        a.level === "exceeded"
          ? `تجاوزت ميزانية «${a.category}» — توقف عن الصرف فيها`
          : `وصلت «${a.category}» إلى ${a.pct}% من الميزانية`,
      action: "عرض الفئات",
      actionUrl: "/finance",
      priority: a.level === "exceeded" ? "urgent" : "normal",
    });
  }

  if (data.nearestRenewal && data.nearestRenewal.daysLeft <= 7) {
    insights.push({
      id: "sub-renewal",
      message: `«${data.nearestRenewal.name}» يتجدد خلال ${data.nearestRenewal.daysLeft} يوم`,
      action: "مراجعة",
      actionUrl: "/finance",
      priority: "normal",
    });
  }

  return insights;
}
