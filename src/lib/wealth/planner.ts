/** Financial milestone forecasting with compound growth */

export function forecastMilestoneMonths(
  currentNet: number,
  monthlyContribution: number,
  target: number,
  annualReturnPct = 7
): number | null {
  if (currentNet >= target) return 0;
  if (monthlyContribution <= 0 && annualReturnPct <= 0) return null;

  const monthlyRate = annualReturnPct / 100 / 12;
  let balance = currentNet;
  let months = 0;
  const maxMonths = 600;

  while (balance < target && months < maxMonths) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    months += 1;
  }
  return months >= maxMonths ? null : months;
}

export function addMonthsToDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function forecastSavingsGoalDate(
  current: number,
  target: number,
  monthly: number
): string | null {
  const remaining = target - current;
  if (remaining <= 0) return new Date().toISOString().slice(0, 10);
  if (monthly <= 0) return null;
  const months = Math.ceil(remaining / monthly);
  return addMonthsToDate(months);
}

export function compoundForecast(
  start: number,
  monthlyAdd: number,
  annualReturnPct: number,
  years: number
): number {
  const months = years * 12;
  const r = annualReturnPct / 100 / 12;
  let v = start;
  for (let i = 0; i < months; i++) v = v * (1 + r) + monthlyAdd;
  return Math.round(v);
}
