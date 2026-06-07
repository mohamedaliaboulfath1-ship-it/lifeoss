"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { MotionModal } from "@/components/motion/motion";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MiniChart } from "@/components/ui/mini-chart";
import { WealthDashboardPanel } from "@/components/finance/wealth-dashboard-panel";
import { financePost, financeDelete, loadFinanceAll } from "@/components/finance/finance-api";
import { subscriptionMonthlyEquivalent } from "@/lib/wealth/categories";
import { forecastSavingsGoalDate } from "@/lib/wealth/planner";
import { compoundForecast } from "@/lib/wealth/planner";
import { commas, today } from "@/lib/utils";
import type { Transaction, YearPayload } from "@/types/lifeos";
import type {
  WealthSnapshot, Subscription, Investment, SavingsGoal,
  WealthDebt, ExpenseCategory,
} from "@/types/wealth";

const TABS = [
  { id: "wealth", label: "💎 الثروة" },
  { id: "subscriptions", label: "📱 اشتراكات" },
  { id: "installments", label: "🏦 أقساط" },
  { id: "investments", label: "📈 استثمارات" },
  { id: "savings", label: "🎯 ادخار" },
  { id: "planner", label: "🔮 مخطط" },
  { id: "categories", label: "📊 فئات" },
  { id: "transactions", label: "💳 معاملات" },
];

const ASSET_TYPES = [
  { id: "stock", label: "أسهم" }, { id: "etf", label: "ETF" },
  { id: "mutual_fund", label: "صندوق" }, { id: "real_estate", label: "عقار" },
  { id: "gold", label: "ذهب" }, { id: "crypto", label: "كريبتو" },
  { id: "deposit", label: "وديعة" }, { id: "sukuk", label: "صكوك" },
  { id: "other", label: "أخرى" },
];

const CYCLES = [
  { id: "monthly", label: "شهري" }, { id: "quarterly", label: "ربع سنوي" },
  { id: "semi_annual", label: "نصف سنوي" }, { id: "annual", label: "سنوي" },
];

interface Props {
  yearData: YearPayload;
  salary?: number | null;
}

export function WealthFinanceView({ yearData, salary }: Props) {
  const [tab, setTab] = useState("wealth");
  const [loading, setLoading] = useState(true);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [wealth, setWealth] = useState<WealthSnapshot | null>(null);
  const [txs, setTxs] = useState<Transaction[]>(yearData.transactions ?? []);
  const [debts, setDebts] = useState<WealthDebt[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [modal, setModal] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { fin, wealth: w, migrationRequired: mig } = await loadFinanceAll();
      if (mig) setMigrationRequired(true);
      setWealth(w ?? null);
      setTxs(fin.transactions ?? []);
      setDebts(fin.debts ?? []);
      setSubs(fin.subscriptions ?? []);
      setInvestments(fin.investments ?? []);
      setGoals(fin.savingsGoals ?? []);
      setCategories(fin.categories ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const subMonthly = subs.filter((s) => s.active).reduce((a, s) => a + subscriptionMonthlyEquivalent(s.price, s.billingCycle), 0);

  async function save(entity: string, payload: Record<string, unknown>) {
    await financePost(entity, payload);
    setModal(null);
    setForm({});
    await reload();
  }

  if (loading && !wealth) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 skeleton-shimmer rounded-[10px]" />)}</div>;
  }

  if (migrationRequired) {
    return (
      <EmptyState
        icon="⚠️"
        title="مطلوب تفعيل نظام الثروة"
        description="شغّل migration 013_wealth_management.sql في Supabase SQL Editor ثم أعد تحميل الصفحة."
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="💰 إدارة الثروة" subtitle="Wealth Management — ليس محاسبة، بل نظام ثروة متكامل" />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "wealth" && wealth && <WealthDashboardPanel snapshot={wealth} />}

      {tab === "subscriptions" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center"><div className="text-2xl font-black text-gold2">{commas(Math.round(subMonthly))}</div><div className="text-xs text-text3">شهرياً ﷼</div></Card>
            <Card className="p-4 text-center"><div className="text-2xl font-black text-rose2">{commas(Math.round(subMonthly * 12))}</div><div className="text-xs text-text3">سنوياً ﷼</div></Card>
            <Card className="p-4 text-center"><div className="text-2xl font-black">{subs.filter((s) => s.active).length}</div><div className="text-xs text-text3">اشتراك نشط</div></Card>
          </div>
          <Button variant="gold" onClick={() => { setModal("sub"); setForm({ billingCycle: "monthly", renewalDate: today() }); }}>+ اشتراك</Button>
          {subs.length === 0 ? <EmptyState icon="📱" title="لا اشتراكات" description="أضف Netflix، iCloud، Gym..." actionLabel="+ إضافة" onAction={() => setModal("sub")} /> : (
            <div className="space-y-2">
              {subs.map((s) => (
                <Card key={s.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold">{s.name}</div>
                    <div className="text-xs text-text3">{s.category} · {CYCLES.find((c) => c.id === s.billingCycle)?.label} · {commas(s.price)} {s.currency}</div>
                    {s.renewalDate && <div className="text-[10px] text-amber2">تجديد: {s.renewalDate}</div>}
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm font-mono text-gold2">{commas(Math.round(subscriptionMonthlyEquivalent(s.price, s.billingCycle)))} ﷼/شهر</span>
                    <Button variant="danger" size="sm" onClick={() => financeDelete("subscription", s.id).then(reload)}>حذف</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "installments" && (
        <div className="space-y-4">
          <Button variant="gold" onClick={() => setModal("debt")}>+ التزام / قرض</Button>
          {debts.length === 0 ? <EmptyState icon="🏦" title="لا التزامات" actionLabel="+ إضافة" onAction={() => setModal("debt")} /> : (
            <div className="grid md:grid-cols-2 gap-4">
              {debts.map((d) => (
                <Card key={d.id} className="p-4 space-y-3">
                  <div className="flex justify-between"><span className="font-bold">{d.name}</span><span className="text-xs text-text3">{d.lender}</span></div>
                  <ProgressBar value={d.payoffPct ?? 0} color="var(--emerald)" />
                  <div className="grid grid-cols-2 gap-2 text-xs text-text3">
                    <span>متبقي: {commas(d.remaining)} ﷼</span>
                    <span>قسط: {commas(d.monthlyPayment ?? 0)} ﷼</span>
                    <span>فائدة: {d.interestRate ?? 0}%</span>
                    <span>أقساط: {d.installmentsPaid ?? 0}/{d.totalInstallments ?? "—"}</span>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => financeDelete("debt", d.id).then(reload)}>حذف</Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "investments" && (
        <div className="space-y-4">
          <Button variant="gold" onClick={() => { setModal("inv"); setForm({ assetType: "etf", riskLevel: "medium" }); }}>+ استثمار</Button>
          {investments.length === 0 ? <EmptyState icon="📈" title="محفظة فارغة" actionLabel="+ إضافة" onAction={() => setModal("inv")} /> : (
            <>
              <MiniChart type="bar" color="var(--purple)" height={100} data={investments.map((i) => ({ label: i.name.slice(0, 5), value: i.currentValue }))} />
              <div className="space-y-2">
                {investments.map((i) => (
                  <Card key={i.id} className="p-4 flex justify-between items-center gap-3">
                    <div>
                      <div className="font-bold">{i.name}</div>
                      <div className="text-xs text-text3">{ASSET_TYPES.find((a) => a.id === i.assetType)?.label} · مخاطرة {i.riskLevel}</div>
                    </div>
                    <div className="text-left">
                      <div className="font-mono text-gold2">{commas(i.currentValue)} ﷼</div>
                      <div className={`text-xs ${(i.gainLoss ?? 0) >= 0 ? "text-emerald" : "text-rose2"}`}>
                        {(i.gainLoss ?? 0) >= 0 ? "+" : ""}{commas(i.gainLoss ?? 0)} ({i.gainLossPct}%)
                      </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => financeDelete("investment", i.id).then(reload)}>حذف</Button>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "savings" && (
        <div className="space-y-4">
          <Button variant="gold" onClick={() => { setModal("goal"); setForm({ goalType: "emergency" }); }}>+ هدف ادخار</Button>
          {goals.length === 0 ? <EmptyState icon="🎯" title="لا أهداف ادخار" example="صندوق طوارئ 30,000 ﷼" actionLabel="+ إضافة" onAction={() => setModal("goal")} /> : (
            <div className="grid md:grid-cols-2 gap-4">
              {goals.map((g) => {
                const forecast = forecastSavingsGoalDate(g.currentAmount, g.targetAmount, g.monthlyContribution);
                return (
                  <Card key={g.id} className="p-4 space-y-2">
                    <div className="font-bold">{g.name}</div>
                    <ProgressBar value={g.progressPct ?? 0} color="var(--gold)" />
                    <div className="text-xs text-text3">{commas(g.currentAmount)} / {commas(g.targetAmount)} ﷼</div>
                    {forecast && <div className="text-[10px] text-emerald">توقع الوصول: {forecast}</div>}
                    <Button variant="ghost" size="sm" onClick={() => financeDelete("savings_goal", g.id).then(reload)}>حذف</Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "planner" && wealth && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">معالم الثروة — متى تصل؟</div>
            <div className="space-y-3">
              {wealth.milestones.map((m) => (
                <div key={m.amount} className="flex justify-between items-center p-3 rounded-sm bg-surface2 border border-border">
                  <span className="font-bold">{m.label}</span>
                  <span className="text-sm text-text3">
                    {m.monthsAway == null ? "—" : m.monthsAway === 0 ? "✅ وصلت!" : `~${m.monthsAway} شهر (${m.dateEst})`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">توقعات 1–3 سنوات</div>
            <MiniChart
              type="line"
              color="var(--gold)"
              height={140}
              data={[1, 2, 3].map((y) => ({
                label: `${y}س`,
                value: compoundForecast(wealth.netWorth, wealth.monthlyCashFlow * 0.2, 7, y),
              }))}
            />
          </Card>
        </div>
      )}

      {tab === "categories" && (
        <div className="space-y-4">
          <Button variant="gold" onClick={() => setModal("cat")}>+ فئة</Button>
          {wealth?.budgetAlerts && wealth.budgetAlerts.length > 0 && (
            <Card className="p-3 border-amber2/30 bg-amber2/5 text-sm space-y-1">
              {wealth.budgetAlerts.filter((b) => b.level !== "ok").map((b) => (
                <div key={b.category}>
                  {b.level === "exceeded" ? "🛑" : "⚠️"} {b.category}: {b.pct}% ({commas(b.spent)}/{commas(b.budget)} ﷼)
                </div>
              ))}
            </Card>
          )}
          <div className="space-y-2">
            {categories.map((c) => {
              const alert = wealth?.budgetAlerts?.find((b) => b.category === c.name);
              const pct = alert?.pct ?? 0;
              return (
                <Card key={c.id} className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>{c.icon} {c.name}</span>
                    <span className="text-xs text-text3">ميزانية: {c.monthlyBudget ? `${commas(c.monthlyBudget)} ﷼` : "—"}</span>
                  </div>
                  {c.monthlyBudget ? <ProgressBar value={Math.min(100, pct)} color={pct >= 100 ? "var(--rose)" : pct >= 50 ? "var(--amber)" : "var(--emerald)"} /> : null}
                  <Button variant="ghost" size="sm" onClick={() => { setForm({ id: c.id, name: c.name, monthlyBudget: String(c.monthlyBudget ?? "") }); setModal("cat"); }}>تعديل</Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === "transactions" && (
        <div className="space-y-4">
          <Button variant="gold" onClick={() => { setModal("tx"); setForm({ type: "expense", date: today(), cat: "عام" }); }}>+ معاملة</Button>
          <Card className="p-4 divide-y divide-border/50">
            {txs.slice(0, 40).map((t) => (
              <div key={t.id} className="py-2 flex justify-between text-sm">
                <span>{t.cat} — {t.note ?? t.type}</span>
                <span className={`font-mono ${t.type === "income" ? "text-emerald" : t.type === "saving" ? "text-gold2" : "text-rose2"}`}>
                  {t.type === "expense" ? "−" : "+"}{commas(t.amount)}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <MotionModal open={!!modal} onClose={() => setModal(null)}>
        <div className="bg-surface border border-border2 rounded-[10px] p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {modal === "sub" && (
            <>
              <h3 className="font-bold text-gold2">اشتراك جديد</h3>
              <div><Label>الاسم</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>السعر</Label><Input type="number" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>التجديد</Label><Input type="date" value={form.renewalDate ?? ""} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} /></div>
              </div>
              <div><Label>الدورة</Label>
                <select className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm" value={form.billingCycle ?? "monthly"} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
                  {CYCLES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <Button variant="gold" onClick={() => save("subscription", { name: form.name, price: parseFloat(form.price), billingCycle: form.billingCycle, renewalDate: form.renewalDate, category: form.category ?? "اشتراكات" })}>حفظ</Button>
            </>
          )}
          {modal === "debt" && (
            <>
              <h3 className="font-bold text-gold2">قرض / قسط</h3>
              <div><Label>الاسم</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>الجهة</Label><Input value={form.lender ?? ""} onChange={(e) => setForm({ ...form, lender: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الإجمالي</Label><Input type="number" value={form.total ?? ""} onChange={(e) => setForm({ ...form, total: e.target.value })} /></div>
                <div><Label>المدفوع</Label><Input type="number" value={form.paid ?? "0"} onChange={(e) => setForm({ ...form, paid: e.target.value })} /></div>
                <div><Label>قسط شهري</Label><Input type="number" value={form.monthlyPayment ?? ""} onChange={(e) => setForm({ ...form, monthlyPayment: e.target.value })} /></div>
                <div><Label>فائدة %</Label><Input type="number" value={form.interestRate ?? "0"} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} /></div>
              </div>
              <Button variant="gold" onClick={() => save("debt", { name: form.name, lender: form.lender, total: parseFloat(form.total ?? "0"), paid: parseFloat(form.paid ?? "0"), monthlyPayment: parseFloat(form.monthlyPayment ?? "0"), interestRate: parseFloat(form.interestRate ?? "0"), debtType: "installment" })}>حفظ</Button>
            </>
          )}
          {modal === "inv" && (
            <>
              <h3 className="font-bold text-gold2">استثمار</h3>
              <div><Label>الاسم</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>المبلغ</Label><Input type="number" value={form.investedAmount ?? ""} onChange={(e) => setForm({ ...form, investedAmount: e.target.value })} /></div>
                <div><Label>القيمة الحالية</Label><Input type="number" value={form.currentValue ?? ""} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} /></div>
              </div>
              <Button variant="gold" onClick={() => save("investment", { name: form.name, assetType: form.assetType ?? "etf", investedAmount: parseFloat(form.investedAmount ?? "0"), currentValue: parseFloat(form.currentValue ?? form.investedAmount ?? "0"), riskLevel: form.riskLevel ?? "medium" })}>حفظ</Button>
            </>
          )}
          {modal === "goal" && (
            <>
              <h3 className="font-bold text-gold2">هدف ادخار</h3>
              <div><Label>الاسم</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>المستهدف</Label><Input type="number" value={form.targetAmount ?? ""} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} /></div>
                <div><Label>شهري</Label><Input type="number" value={form.monthlyContribution ?? ""} onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })} /></div>
              </div>
              <Button variant="gold" onClick={() => save("savings_goal", { name: form.name, goalType: form.goalType, targetAmount: parseFloat(form.targetAmount ?? "0"), monthlyContribution: parseFloat(form.monthlyContribution ?? "0") })}>حفظ</Button>
            </>
          )}
          {modal === "cat" && (
            <>
              <h3 className="font-bold text-gold2">فئة مصروف</h3>
              <div><Label>الاسم</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>ميزانية شهرية</Label><Input type="number" value={form.monthlyBudget ?? ""} onChange={(e) => setForm({ ...form, monthlyBudget: e.target.value })} /></div>
              <Button variant="gold" onClick={() => save("category", { id: form.id, name: form.name, monthlyBudget: parseFloat(form.monthlyBudget ?? "0") })}>حفظ</Button>
            </>
          )}
          {modal === "tx" && (
            <>
              <h3 className="font-bold text-gold2">معاملة</h3>
              <div><Label>الفئة</Label><Input value={form.cat ?? ""} onChange={(e) => setForm({ ...form, cat: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>المبلغ</Label><Input type="number" value={form.amount ?? ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>النوع</Label>
                  <select className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm" value={form.type ?? "expense"} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="expense">مصروف</option><option value="income">دخل</option><option value="saving">ادخار</option>
                  </select>
                </div>
              </div>
              <Button variant="gold" onClick={() => save("transaction", { date: form.date ?? today(), type: form.type, amount: parseFloat(form.amount ?? "0"), cat: form.cat })}>حفظ</Button>
            </>
          )}
        </div>
      </MotionModal>
    </div>
  );
}
