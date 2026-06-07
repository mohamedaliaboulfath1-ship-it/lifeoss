import { z } from "zod";

export const subscriptionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().default("SAR"),
  billingCycle: z.enum(["monthly", "quarterly", "semi_annual", "annual"]),
  renewalDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  cancellable: z.boolean().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});

export const investmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  assetType: z.enum([
    "stock", "etf", "mutual_fund", "real_estate", "gold", "silver",
    "crypto", "private", "deposit", "sukuk", "bond", "other",
  ]),
  investedAmount: z.number().nonnegative(),
  purchaseDate: z.string().optional(),
  costBasis: z.number().optional(),
  currentValue: z.number().nonnegative(),
  annualReturnPct: z.number().optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  notes: z.string().optional(),
});

export const savingsGoalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  goalType: z.enum(["emergency", "car", "home", "wedding", "investment", "custom"]).optional(),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().optional(),
  monthlyContribution: z.number().nonnegative().optional(),
  targetDate: z.string().optional(),
  priority: z.number().optional(),
  notes: z.string().optional(),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  monthlyBudget: z.number().nonnegative().optional(),
  sortOrder: z.number().optional(),
});

export const extendedDebtSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  total: z.number().nonnegative(),
  paid: z.number().nonnegative(),
  monthlyPayment: z.number().nonnegative().optional(),
  dueDate: z.string().optional(),
  debtType: z.enum(["installment", "loan", "credit_card"]).optional(),
  lender: z.string().optional(),
  assetValue: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  interestRate: z.number().optional(),
  totalInstallments: z.number().int().optional(),
  installmentsPaid: z.number().int().optional(),
  notes: z.string().optional(),
});

export type FinanceEntity =
  | "transaction" | "debt" | "budget"
  | "subscription" | "investment" | "savings_goal" | "category";

export function mapSubscription(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    category: r.category ?? undefined,
    description: r.description ?? undefined,
    price: r.price,
    currency: r.currency ?? "SAR",
    billingCycle: r.billing_cycle,
    renewalDate: r.renewal_date ?? undefined,
    paymentMethod: r.payment_method ?? undefined,
    cancellable: r.cancellable ?? true,
    notes: r.notes ?? undefined,
    active: r.active ?? true,
  };
}

export function mapInvestment(r: Record<string, unknown>) {
  const cost = (r.cost_basis as number) ?? (r.invested_amount as number) ?? 0;
  const cur = (r.current_value as number) ?? 0;
  const gain = cur - cost;
  return {
    id: r.id,
    name: r.name,
    assetType: r.asset_type,
    investedAmount: r.invested_amount,
    purchaseDate: r.purchase_date ?? undefined,
    costBasis: r.cost_basis ?? undefined,
    currentValue: cur,
    annualReturnPct: r.annual_return_pct ?? undefined,
    riskLevel: r.risk_level ?? undefined,
    notes: r.notes ?? undefined,
    gainLoss: Math.round(gain),
    gainLossPct: cost > 0 ? Math.round((gain / cost) * 100) : 0,
  };
}

export function mapSavingsGoal(r: Record<string, unknown>) {
  const target = r.target_amount as number;
  const current = (r.current_amount as number) ?? 0;
  return {
    id: r.id,
    name: r.name,
    goalType: r.goal_type,
    targetAmount: target,
    currentAmount: current,
    monthlyContribution: r.monthly_contribution ?? 0,
    targetDate: r.target_date ?? undefined,
    priority: r.priority ?? 0,
    notes: r.notes ?? undefined,
    progressPct: target > 0 ? Math.round((current / target) * 100) : 0,
  };
}

export function mapCategory(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    icon: r.icon ?? undefined,
    color: r.color ?? undefined,
    monthlyBudget: r.monthly_budget ?? undefined,
    sortOrder: r.sort_order ?? 0,
    isSystem: r.is_system ?? false,
  };
}

export function mapExtendedDebt(d: Record<string, unknown>) {
  const total = d.amount as number;
  const remaining = d.remaining_amount as number;
  const paid = Math.max(0, total - remaining);
  const totalInst = d.total_installments as number | undefined;
  const paidInst = (d.installments_paid as number) ?? 0;
  const monthly = (d.monthly_payment as number) ?? 0;
  const rate = (d.interest_rate as number) ?? 0;
  const interestEst = monthly * paidInst * (rate / 100);
  return {
    id: d.id,
    name: d.name,
    lender: d.lender ?? undefined,
    debtType: d.debt_type ?? undefined,
    total,
    paid,
    remaining,
    monthlyPayment: monthly || undefined,
    dueDate: d.due_date ?? undefined,
    assetValue: d.asset_value ?? undefined,
    startDate: d.start_date ?? undefined,
    endDate: d.end_date ?? undefined,
    interestRate: rate || undefined,
    totalInstallments: totalInst,
    installmentsPaid: paidInst,
    payoffPct: total > 0 ? Math.round((paid / total) * 100) : 0,
    totalInterestEst: Math.round(interestEst),
    notes: d.notes ?? undefined,
  };
}
