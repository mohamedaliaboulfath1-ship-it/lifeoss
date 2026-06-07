# LifeOS Pro — Wealth Management Architecture

## Philosophy

Finance is not an expense tracker. It answers:

| Question | Source |
|----------|--------|
| كم ثروتي؟ | `netWorth = cash + savings + investments − debts` |
| أين أستثمر؟ | `investments` portfolio + allocation charts |
| هل أنا قريب من أهدافي؟ | `savings_goals` + FI progress |
| كم للحرية المالية؟ | `profiles.fi_target_amount` vs net worth |
| التزامات قادمة؟ | `debts` + `subscriptions.renewal_date` |
| اشتراكات مستنزفة؟ | `subscriptions` monthly equivalent |
| معدل الادخار/الاستثمار؟ | month income → savings/investment rates |
| توقع بعد 1–3 سنوات؟ | `lib/wealth/planner.ts` compound forecast |
| فئات المصاريف + ميزانية؟ | `expense_categories` + spend alerts |

## Data Model (Migration 013)

```
profiles (+ cash_balance, fi_target_amount, expected_annual_return_pct)
expense_categories   — فئات قابلة للتخصيص + monthly_budget
subscriptions        — اشتراكات متكررة
investments          — محفظة استثمارية
savings_goals        — أهداف ادخار متقدمة
debts (+ lender, asset_value, dates, interest, installments)
progress_photos (+ photo_angle, body_fat_pct)
net_worth_snapshots  — لقطات تاريخية (اختياري)
transactions         — (existing) income/expense/savings
budgets              — (legacy, kept for compat)
```

## API Surface

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/finance?type=all` | GET | transactions, debts, budgets + **new entities** |
| `/api/finance` | POST/PATCH/DELETE | CRUD all entities |
| `/api/finance/wealth` | GET | computed wealth dashboard snapshot |
| `/api/body/photos` | GET/POST/DELETE | progress photos + signed URLs |

## UI Wireframe (Tabs)

```
[ثروة] [اشتراكات] [أقساط] [استثمارات] [ادخار] [مخطط] [فئات] [معاملات]

ثروة:
  KPI row: Net Worth | Cash | Savings | Investments | Debts
  Rates: Savings Rate | Investment Rate | FI Progress
  Charts: Cash flow trend | Allocation pie | Net worth trend

اشتراكات: list + add modal, monthly/yearly totals, renewal alerts
أقساط: debt cards with payoff %, interest, timeline chart
استثمارات: portfolio table + allocation pie + P&L
ادخار: goal cards with forecast date
مخطط: milestones 100k / 500k / 1M scenarios
فئات: category budget bars + alerts (50% mid-month, 100% stop)
معاملات: existing transaction list
```

## Life Coach Integration

`lib/wealth/coach-insights.ts` feeds `buildActionableInsights`:
- Low savings rate
- High subscription burn (>15% income)
- Debt > savings
- Budget category overrun
- Subscription renewal within 7 days

## Implementation Phases

1. ✅ Migration 013 + types + wealth calculator
2. ✅ API extension + wealth endpoint + photos API
3. ✅ Wealth Finance UI (all tabs)
4. ✅ Progress Photos timeline + compare
5. ✅ Coach insights + notification seeds
