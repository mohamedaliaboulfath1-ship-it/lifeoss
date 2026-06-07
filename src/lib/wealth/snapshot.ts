import type { SupabaseClient } from "@supabase/supabase-js";
import type { WealthSnapshot, BudgetAlertLevel } from "@/types/wealth";
import { subscriptionMonthlyEquivalent } from "./categories";
import { forecastMilestoneMonths, addMonthsToDate } from "./planner";
import { buildWealthCoachInsights } from "./coach-insights";

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

export function budgetAlertLevel(pct: number, dayOfMonth: number): BudgetAlertLevel {
  const midMonth = dayOfMonth >= 15;
  if (pct >= 100) return "exceeded";
  if (pct >= 80) return "critical";
  if (pct >= 50 && midMonth) return "warning";
  return "ok";
}

export async function buildWealthSnapshot(
  db: SupabaseClient,
  userId: string
): Promise<WealthSnapshot> {
  const mk = monthKey();
  const dayOfMonth = new Date().getDate();

  const [
    profileRes,
    txRes,
    invRes,
    subRes,
    debtRes,
    catRes,
  ] = await Promise.all([
    db.from("profiles").select("cash_balance, fi_target_amount, expected_annual_return_pct, salary").eq("id", userId).maybeSingle(),
    db.from("transactions").select("type, amount, category, tx_date").eq("user_id", userId),
    db.from("investments").select("current_value, asset_type, name").eq("user_id", userId),
    db.from("subscriptions").select("*").eq("user_id", userId).eq("active", true),
    db.from("debts").select("remaining_amount").eq("user_id", userId).eq("status", "active"),
    db.from("expense_categories").select("*").eq("user_id", userId).order("sort_order"),
  ]);

  const profile = profileRes.data;
  const txs = txRes.data ?? [];
  const investments = invRes.data ?? [];
  const subs = subRes.data ?? [];
  const debts = debtRes.data ?? [];

  const cash = profile?.cash_balance ?? 0;
  const savings = txs
    .filter((t) => t.type === "savings" || t.type === "saving")
    .reduce((s, t) => s + t.amount, 0);
  const invTotal = investments.reduce((s, i) => s + (i.current_value ?? 0), 0);
  const debtTotal = debts.reduce((s, d) => s + (d.remaining_amount ?? 0), 0);
  const netWorth = cash + savings + invTotal - debtTotal;

  const monthTxs = txs.filter((t) => t.tx_date?.startsWith(mk));
  const monthlyIncome = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthlyExpense = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthlySaving = monthTxs.filter((t) => t.type === "savings").reduce((s, t) => s + t.amount, 0);
  const monthlyCashFlow = monthlyIncome - monthlyExpense;
  const incomeBase = monthlyIncome || (profile?.salary ?? 0);
  const savingsRate = incomeBase > 0 ? Math.round((monthlySaving / incomeBase) * 100) : 0;
  const investmentRate = incomeBase > 0 ? Math.round((invTotal > 0 ? monthlySaving * 0.5 : 0) / incomeBase * 100) : 0;

  const fiTarget = profile?.fi_target_amount ?? 1_000_000;
  const fiProgress = fiTarget > 0 ? Math.min(100, Math.round((netWorth / fiTarget) * 100)) : 0;

  const subscriptionMonthly = subs.reduce(
    (s, sub) => s + subscriptionMonthlyEquivalent(sub.price, sub.billing_cycle),
    0
  );

  let nearestRenewal: WealthSnapshot["nearestRenewal"];
  for (const sub of subs) {
    if (!sub.renewal_date) continue;
    const days = Math.round((new Date(sub.renewal_date).getTime() - Date.now()) / 86400000);
    if (!nearestRenewal || days < nearestRenewal.daysLeft) {
      nearestRenewal = { name: sub.name, date: sub.renewal_date, daysLeft: days };
    }
  }

  const bucket: Record<string, { income: number; expense: number }> = {};
  for (const t of txs) {
    const m = t.tx_date?.slice(0, 7);
    if (!m) continue;
    if (!bucket[m]) bucket[m] = { income: 0, expense: 0 };
    if (t.type === "income") bucket[m].income += t.amount;
    if (t.type === "expense") bucket[m].expense += t.amount;
  }
  const cashFlowTrend = Object.entries(bucket)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, v]) => ({ month, ...v, net: v.income - v.expense }));

  const colors = ["var(--gold)", "var(--sky)", "var(--emerald)", "var(--purple)", "var(--amber)", "var(--teal)"];
  const allocationRaw = [
    { label: "نقد", value: cash },
    { label: "ادخار", value: savings },
    ...investments.map((i) => ({ label: i.name, value: i.current_value ?? 0 })),
  ].filter((a) => a.value > 0);
  const allocSum = allocationRaw.reduce((s, a) => s + a.value, 0) || 1;
  const allocation = allocationRaw.map((a, i) => ({
    ...a,
    pct: Math.round((a.value / allocSum) * 100),
    color: colors[i % colors.length],
  }));

  const categories = catRes.data ?? [];
  const spendByCat: Record<string, number> = {};
  for (const t of monthTxs.filter((t) => t.type === "expense")) {
    const cat = t.category ?? "أخرى";
    spendByCat[cat] = (spendByCat[cat] ?? 0) + t.amount;
  }
  const budgetAlerts = categories
    .filter((c) => c.monthly_budget && c.monthly_budget > 0)
    .map((c) => {
      const spent = spendByCat[c.name] ?? 0;
      const budget = c.monthly_budget!;
      const pct = Math.round((spent / budget) * 100);
      return {
        category: c.name,
        spent,
        budget,
        pct,
        level: budgetAlertLevel(pct, dayOfMonth),
      };
    });

  const monthlyContrib = monthlySaving || monthlyCashFlow * 0.2;
  const returnPct = profile?.expected_annual_return_pct ?? 7;
  const milestones = [
    { amount: 100_000, label: "100 ألف ﷼" },
    { amount: 500_000, label: "500 ألف ﷼" },
    { amount: 1_000_000, label: "مليون ﷼" },
  ].map((m) => {
    const months = forecastMilestoneMonths(netWorth, monthlyContrib, m.amount, returnPct);
    return {
      ...m,
      monthsAway: months,
      dateEst: months != null ? addMonthsToDate(months) : null,
    };
  });

  const coachInsights = buildWealthCoachInsights({
    savingsRate,
    subscriptionMonthly,
    monthlyIncome: incomeBase,
    debts: debtTotal,
    savings,
    budgetAlerts,
    nearestRenewal,
  });

  return {
    netWorth: Math.round(netWorth),
    cash: Math.round(cash),
    savings: Math.round(savings),
    investments: Math.round(invTotal),
    debts: Math.round(debtTotal),
    monthlyIncome: Math.round(incomeBase),
    monthlyExpense: Math.round(monthlyExpense),
    monthlyCashFlow: Math.round(monthlyCashFlow),
    savingsRate,
    investmentRate,
    fiTarget,
    fiProgress,
    subscriptionMonthly: Math.round(subscriptionMonthly),
    subscriptionYearly: Math.round(subscriptionMonthly * 12),
    nearestRenewal,
    allocation,
    cashFlowTrend,
    milestones,
    budgetAlerts,
    coachInsights,
  };
}
