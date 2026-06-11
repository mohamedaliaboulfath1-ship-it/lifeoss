"use client";
import { ViewShell } from "@/components/motion/view-shell";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { commas, today, uid } from "@/lib/utils";
import type { Debt, Transaction, YearPayload } from "@/types/lifeos";

interface FinanceViewProps {
  yearData: YearPayload;
  salary?: number | null;
  onSave?: (data: YearPayload) => Promise<void>;
}

type BudgetItem = {
  id: string;
  category: string;
  monthly_limit: number;
  month: number;
  year: number;
  notes?: string | null;
};

type FinanceTab = "overview" | "transactions" | "debts" | "budgets";

export function FinanceView({ yearData, salary }: FinanceViewProps) {
  const [tab, setTab] = useState<FinanceTab>("overview");
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState<Transaction[]>(yearData.transactions ?? []);
  const [debts, setDebts] = useState<Debt[]>(yearData.debts ?? []);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [modal, setModal] = useState<null | "tx" | "debt" | "budget">(null);

  const [txForm, setTxForm] = useState({
    id: "",
    type: "expense" as Transaction["type"],
    amount: "",
    cat: "عام",
    note: "",
    date: today(),
  });
  const [debtForm, setDebtForm] = useState({
    id: "",
    name: "",
    total: "",
    paid: "",
    monthlyPayment: "",
    dueDate: "",
  });
  const [budgetForm, setBudgetForm] = useState({
    id: "",
    category: "",
    monthlyLimit: "",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function loadFinance() {
      setLoading(true);
      const res = await fetch("/api/finance?type=all");
      const json = await res.json().catch(() => ({}));
      if (!cancelled && res.ok) {
        setTxs((json.transactions as Transaction[]) ?? []);
        setDebts((json.debts as Debt[]) ?? []);
        setBudgets((json.budgets as BudgetItem[]) ?? []);
      }
      if (!cancelled) setLoading(false);
    }
    loadFinance();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthly = txs.filter((t) => t.date.startsWith(thisMonth));
    const income = monthly.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = monthly.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const saving = monthly.filter((t) => t.type === "saving").reduce((s, t) => s + t.amount, 0);
    const totalSaving = txs.filter((t) => t.type === "saving").reduce((s, t) => s + t.amount, 0);
    const debtRemaining = debts.reduce((s, d) => s + Math.max(0, d.total - d.paid), 0);
    return { income, expense, saving, totalSaving, debtRemaining, net: income - expense };
  }, [txs]);

  const cashFlow = useMemo(() => {
    const bucket: Record<string, { income: number; expense: number }> = {};
    for (const t of txs) {
      const month = t.date.slice(0, 7);
      if (!bucket[month]) bucket[month] = { income: 0, expense: 0 };
      if (t.type === "income") bucket[month].income += t.amount;
      if (t.type === "expense") bucket[month].expense += t.amount;
    }
    return Object.entries(bucket)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, val]) => ({ month, ...val, net: val.income - val.expense }));
  }, [txs]);

  const savingsForecast = useMemo(() => {
    const monthlySaving = cashFlow.length
      ? cashFlow.reduce((s, c) => s + Math.max(0, c.net), 0) / cashFlow.length
      : 0;
    return Math.round(stats.totalSaving + monthlySaving * 6);
  }, [cashFlow, stats.totalSaving]);

  const financeInsights = useMemo(() => {
    const items: string[] = [];
    if (stats.net < 0) items.push("المصروف الشهري أعلى من الدخل، يحتاج ضبط فوري.");
    if (stats.totalSaving < 1000) items.push("الادخار التراكمي منخفض؛ ابدأ بتحويل تلقائي شهري.");
    if (stats.debtRemaining > stats.totalSaving) items.push("إجمالي الديون أعلى من المدخرات الحالية.");
    if (!items.length) items.push("الأداء المالي جيد هذا الشهر مع توازن مقبول.");
    return items;
  }, [stats]);

  async function addOrUpdateTx() {
    const amount = parseFloat(txForm.amount);
    if (!amount) return;
    await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "transaction",
        payload: {
          id: txForm.id || uid(),
          date: txForm.date,
          type: txForm.type,
          amount,
          cat: txForm.cat,
          note: txForm.note,
        },
      }),
    });
    const tx: Transaction = {
      id: txForm.id || uid(),
      date: txForm.date,
      type: txForm.type,
      amount,
      cat: txForm.cat,
      note: txForm.note || undefined,
    };
    setTxs((prev) =>
      prev.some((p) => p.id === tx.id)
        ? prev.map((p) => (p.id === tx.id ? tx : p))
        : [tx, ...prev]
    );
    setModal(null);
    setTxForm({ id: "", type: "expense", amount: "", cat: "عام", note: "", date: today() });
  }

  async function addOrUpdateDebt() {
    const total = parseFloat(debtForm.total);
    const paid = parseFloat(debtForm.paid || "0");
    if (!debtForm.name.trim() || !total) return;
    const id = debtForm.id || uid();
    await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "debt",
        payload: {
          id,
          name: debtForm.name,
          total,
          paid,
          monthlyPayment: debtForm.monthlyPayment ? parseFloat(debtForm.monthlyPayment) : undefined,
          dueDate: debtForm.dueDate || undefined,
        },
      }),
    });
    const debt: Debt = {
      id,
      name: debtForm.name,
      total,
      paid,
      monthlyPayment: debtForm.monthlyPayment ? parseFloat(debtForm.monthlyPayment) : undefined,
      dueDate: debtForm.dueDate || undefined,
    };
    setDebts((prev) =>
      prev.some((p) => p.id === id) ? prev.map((p) => (p.id === id ? debt : p)) : [debt, ...prev]
    );
    setModal(null);
    setDebtForm({ id: "", name: "", total: "", paid: "", monthlyPayment: "", dueDate: "" });
  }

  async function addOrUpdateBudget() {
    const monthlyLimit = parseFloat(budgetForm.monthlyLimit);
    const month = parseInt(budgetForm.month, 10);
    const year = parseInt(budgetForm.year, 10);
    if (!budgetForm.category.trim() || !monthlyLimit || !month || !year) return;
    const id = budgetForm.id || uid();
    await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "budget",
        payload: {
          id,
          category: budgetForm.category,
          monthlyLimit,
          month,
          year,
          notes: budgetForm.notes || undefined,
        },
      }),
    });
    const budget: BudgetItem = { id, category: budgetForm.category, monthly_limit: monthlyLimit, month, year, notes: budgetForm.notes || null };
    setBudgets((prev) =>
      prev.some((p) => p.id === id) ? prev.map((p) => (p.id === id ? budget : p)) : [budget, ...prev]
    );
    setModal(null);
    setBudgetForm({ id: "", category: "", monthlyLimit: "", month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), notes: "" });
  }

  async function remove(entity: "transaction" | "debt" | "budget", id: string) {
    await fetch(`/api/finance?entity=${entity}&id=${id}`, { method: "DELETE" });
    if (entity === "transaction") setTxs((prev) => prev.filter((p) => p.id !== id));
    if (entity === "debt") setDebts((prev) => prev.filter((p) => p.id !== id));
    if (entity === "budget") setBudgets((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <ViewShell>
      <PageHeader
        title="💰 المال والميزانية"
        subtitle={salary ? `الراتب: ${commas(salary)} ر.س` : "تتبع الدخل والمصروف والادخار"}
        actionLabel="+ إضافة"
        onAction={() => setModal(tab === "debts" ? "debt" : tab === "budgets" ? "budget" : "tx")}
      />

      <ViewShell.Cards>
        <KpiCard label="دخل الشهر" value={commas(stats.income)} numericValue={stats.income} sub="ر.س" color="var(--emerald)" />
        <KpiCard label="مصروف الشهر" value={commas(stats.expense)} numericValue={stats.expense} sub="ر.س" color="var(--rose)" />
        <KpiCard label="صافي التدفق" value={commas(stats.net)} numericValue={stats.net} sub="ر.س" color="var(--gold)" />
        <KpiCard label="الديون المتبقية" value={commas(stats.debtRemaining)} numericValue={stats.debtRemaining} sub="ر.س" color="var(--sky)" />
      </ViewShell.Cards>

      <Tabs
        tabs={[
          { id: "overview", label: "نظرة عامة" },
          { id: "transactions", label: "المعاملات" },
          { id: "debts", label: "الديون" },
          { id: "budgets", label: "الميزانيات" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as FinanceTab)}
      />

      {tab === "overview" && (
        <ViewShell.Analytics delay={0.08}>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 md:col-span-2">
            <div className="font-bold mb-3 text-gold2">📈 التدفق النقدي (آخر 6 أشهر)</div>
            <div className="space-y-2">
              {cashFlow.map((row) => (
                <div key={row.month} className="text-xs border border-border rounded-sm p-2">
                  <div className="flex justify-between mb-1">
                    <span>{row.month}</span>
                    <span className="font-bold">صافي: {commas(row.net)} ر.س</span>
                  </div>
                  <div className="h-2 bg-surface2 rounded overflow-hidden">
                    <div
                      className="h-full bg-emerald"
                      style={{
                        width: `${Math.min(100, Math.round((row.income / Math.max(1, row.income + row.expense)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {!cashFlow.length && <p className="text-text3 text-sm">لا توجد بيانات كافية للرسم.</p>}
            </div>
          </Card>
          <Card className="p-4 space-y-3">
            <div>
              <div className="text-xs text-text3">توقع الادخار بعد 6 أشهر</div>
              <div className="text-2xl font-black text-emerald2">{commas(savingsForecast)} ر.س</div>
            </div>
            <div className="text-xs text-text3">لوحة رؤى مالية</div>
            <ul className="space-y-2 text-sm">
              {financeInsights.map((insight) => (
                <li key={insight} className="border border-border rounded-sm p-2">{insight}</li>
              ))}
            </ul>
          </Card>
        </div>
        </ViewShell.Analytics>
      )}

      {tab === "transactions" && (
        <Card className="p-4">
          {txs.length === 0 ? (
            <EmptyState icon="💰" title="لا معاملات" actionLabel="+ إضافة" onAction={() => setModal("tx")} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text3 text-xs border-b border-border">
                  <th className="text-right py-2">التاريخ</th>
                  <th className="text-right py-2">النوع</th>
                  <th className="text-right py-2">المبلغ</th>
                  <th className="text-right py-2">التصنيف</th>
                  <th className="text-right py-2">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id} className="border-b border-border/50">
                    <td className="py-2 font-mono text-xs">{t.date}</td>
                    <td className="py-2">{t.type === "income" ? "دخل" : t.type === "saving" ? "ادخار" : "مصروف"}</td>
                    <td className="py-2 font-bold">{commas(t.amount)}</td>
                    <td className="py-2 text-text3">{t.cat}</td>
                    <td className="py-2 flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => { setTxForm({ id: t.id, type: t.type, amount: String(t.amount), cat: t.cat, note: t.note ?? "", date: t.date }); setModal("tx"); }}>تعديل</Button>
                      <Button size="sm" variant="danger" onClick={() => remove("transaction", t.id)}>حذف</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "debts" && (
        <Card className="p-4">
          {debts.length === 0 ? (
            <EmptyState icon="🧾" title="لا توجد ديون" actionLabel="+ إضافة دين" onAction={() => setModal("debt")} />
          ) : (
            <div className="space-y-3">
              {debts.map((d) => {
                const remaining = Math.max(0, d.total - d.paid);
                const pct = d.total ? Math.round((d.paid / d.total) * 100) : 0;
                return (
                  <div key={d.id} className="border border-border rounded-sm p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold">{d.name}</div>
                        <div className="text-xs text-text3">متبقي {commas(remaining)} ر.س</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setDebtForm({ id: d.id, name: d.name, total: String(d.total), paid: String(d.paid), monthlyPayment: String(d.monthlyPayment ?? ""), dueDate: d.dueDate ?? "" }); setModal("debt"); }}>تعديل</Button>
                        <Button size="sm" variant="danger" onClick={() => remove("debt", d.id)}>حذف</Button>
                      </div>
                    </div>
                    <div className="h-2 rounded bg-surface2 overflow-hidden">
                      <div className="h-full bg-sky" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {tab === "budgets" && (
        <Card className="p-4">
          {budgets.length === 0 ? (
            <EmptyState icon="📦" title="لا ميزانيات" actionLabel="+ إضافة ميزانية" onAction={() => setModal("budget")} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text3 text-xs border-b border-border">
                  <th className="text-right py-2">الفئة</th>
                  <th className="text-right py-2">الحد الشهري</th>
                  <th className="text-right py-2">الشهر</th>
                  <th className="text-right py-2">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => (
                  <tr key={b.id} className="border-b border-border/50">
                    <td className="py-2">{b.category}</td>
                    <td className="py-2 font-bold">{commas(b.monthly_limit)} ر.س</td>
                    <td className="py-2">{b.month}/{b.year}</td>
                    <td className="py-2 flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => { setBudgetForm({ id: b.id, category: b.category, monthlyLimit: String(b.monthly_limit), month: String(b.month), year: String(b.year), notes: b.notes ?? "" }); setModal("budget"); }}>تعديل</Button>
                      <Button size="sm" variant="danger" onClick={() => remove("budget", b.id)}>حذف</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {loading && <Card className="p-4 text-sm text-text3">جاري تحميل بيانات المالية...</Card>}

      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border2 rounded-[10px] w-full max-w-md p-6 space-y-4">
            {modal === "tx" && (
              <>
                <h3 className="font-bold text-gold2">{txForm.id ? "تعديل معاملة" : "معاملة جديدة"}</h3>
                <select className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm" value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value as Transaction["type"] })}>
                  <option value="expense">مصروف</option>
                  <option value="income">دخل</option>
                  <option value="saving">ادخار</option>
                </select>
                <div>
                  <Label>التاريخ</Label>
                  <Input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
                </div>
                <div>
                  <Label>المبلغ (ر.س)</Label>
                  <Input value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} />
                </div>
                <div>
                  <Label>التصنيف</Label>
                  <Input value={txForm.cat} onChange={(e) => setTxForm({ ...txForm, cat: e.target.value })} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setModal(null)}>إلغاء</Button>
                  <Button variant="gold" onClick={addOrUpdateTx}>حفظ</Button>
                </div>
              </>
            )}
            {modal === "debt" && (
              <>
                <h3 className="font-bold text-gold2">{debtForm.id ? "تعديل دين" : "دين جديد"}</h3>
                <div><Label>اسم الدين</Label><Input value={debtForm.name} onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })} /></div>
                <div><Label>الإجمالي</Label><Input value={debtForm.total} onChange={(e) => setDebtForm({ ...debtForm, total: e.target.value })} /></div>
                <div><Label>المدفوع</Label><Input value={debtForm.paid} onChange={(e) => setDebtForm({ ...debtForm, paid: e.target.value })} /></div>
                <div><Label>القسط الشهري</Label><Input value={debtForm.monthlyPayment} onChange={(e) => setDebtForm({ ...debtForm, monthlyPayment: e.target.value })} /></div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setModal(null)}>إلغاء</Button>
                  <Button variant="gold" onClick={addOrUpdateDebt}>حفظ</Button>
                </div>
              </>
            )}
            {modal === "budget" && (
              <>
                <h3 className="font-bold text-gold2">{budgetForm.id ? "تعديل ميزانية" : "ميزانية جديدة"}</h3>
                <div><Label>الفئة</Label><Input value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })} /></div>
                <div><Label>الحد الشهري</Label><Input value={budgetForm.monthlyLimit} onChange={(e) => setBudgetForm({ ...budgetForm, monthlyLimit: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>الشهر</Label><Input value={budgetForm.month} onChange={(e) => setBudgetForm({ ...budgetForm, month: e.target.value })} /></div>
                  <div><Label>السنة</Label><Input value={budgetForm.year} onChange={(e) => setBudgetForm({ ...budgetForm, year: e.target.value })} /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setModal(null)}>إلغاء</Button>
                  <Button variant="gold" onClick={addOrUpdateBudget}>حفظ</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </ViewShell>
  );
}
