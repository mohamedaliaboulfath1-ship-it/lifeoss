export type BillingCycle = "monthly" | "quarterly" | "semi_annual" | "annual";
export type AssetType =
  | "stock" | "etf" | "mutual_fund" | "real_estate" | "gold" | "silver"
  | "crypto" | "private" | "deposit" | "sukuk" | "bond" | "other";
export type SavingsGoalType = "emergency" | "car" | "home" | "wedding" | "investment" | "custom";
export type PhotoAngle = "front" | "side" | "back";
export type BudgetAlertLevel = "ok" | "warning" | "critical" | "exceeded";

export interface ExpenseCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  monthlyBudget?: number;
  sortOrder: number;
  isSystem: boolean;
  spentThisMonth?: number;
  alertLevel?: BudgetAlertLevel;
}

export interface Subscription {
  id: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  renewalDate?: string;
  paymentMethod?: string;
  cancellable: boolean;
  notes?: string;
  active: boolean;
  monthlyEquivalent?: number;
}

export interface Investment {
  id: string;
  name: string;
  assetType: AssetType;
  investedAmount: number;
  purchaseDate?: string;
  costBasis?: number;
  currentValue: number;
  annualReturnPct?: number;
  riskLevel?: "low" | "medium" | "high";
  notes?: string;
  gainLoss?: number;
  gainLossPct?: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  goalType: SavingsGoalType;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate?: string;
  priority: number;
  notes?: string;
  progressPct?: number;
  forecastDate?: string;
}

export interface WealthDebt {
  id: string;
  name: string;
  lender?: string;
  debtType?: string;
  total: number;
  paid: number;
  remaining: number;
  monthlyPayment?: number;
  dueDate?: string;
  assetValue?: number;
  startDate?: string;
  endDate?: string;
  interestRate?: number;
  totalInstallments?: number;
  installmentsPaid?: number;
  payoffPct?: number;
  totalInterestEst?: number;
}

export interface WealthSnapshot {
  netWorth: number;
  cash: number;
  savings: number;
  investments: number;
  debts: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyCashFlow: number;
  savingsRate: number;
  investmentRate: number;
  fiTarget: number;
  fiProgress: number;
  subscriptionMonthly: number;
  subscriptionYearly: number;
  nearestRenewal?: { name: string; date: string; daysLeft: number };
  allocation: Array<{ label: string; value: number; pct: number; color: string }>;
  cashFlowTrend: Array<{ month: string; income: number; expense: number; net: number }>;
  milestones: Array<{ amount: number; label: string; monthsAway: number | null; dateEst: string | null }>;
  budgetAlerts: Array<{ category: string; spent: number; budget: number; pct: number; level: BudgetAlertLevel }>;
  coachInsights: Array<{ id: string; message: string; action: string; actionUrl: string; priority: string }>;
}

export interface ProgressPhotoEntry {
  id: string;
  photoDate: string;
  photoAngle: PhotoAngle;
  weight?: number;
  bodyFatPct?: number;
  notes?: string;
  storagePath?: string;
  signedUrl?: string;
}

export interface PhotoTimelineGroup {
  date: string;
  weight?: number;
  bodyFatPct?: number;
  notes?: string;
  photos: Partial<Record<PhotoAngle, ProgressPhotoEntry>>;
}
