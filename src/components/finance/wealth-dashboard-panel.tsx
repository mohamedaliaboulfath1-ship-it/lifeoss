"use client";

import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MiniChart } from "@/components/ui/mini-chart";
import { commas } from "@/lib/utils";
import type { WealthSnapshot } from "@/types/wealth";

export function WealthDashboardPanel({ snapshot }: { snapshot: WealthSnapshot }) {
  const pieData = snapshot.allocation.slice(0, 6).map((a) => ({
    label: a.label.slice(0, 6),
    value: a.pct,
  }));

  return (
    <div className="space-y-5">
      {snapshot.coachInsights.length > 0 && (
        <Card className="p-4 border-gold/30 bg-gold/5 space-y-2">
          <div className="text-sm font-bold text-gold2">💡 مدربك المالي</div>
          {snapshot.coachInsights.map((i) => (
            <div key={i.id} className="text-sm text-text2 flex gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${i.priority === "urgent" ? "bg-rose/20 text-rose2" : "bg-surface2 text-text3"}`}>
                {i.priority}
              </span>
              {i.message}
            </div>
          ))}
        </Card>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="💎 صافي الثروة" value={`${commas(snapshot.netWorth)} ﷼`} numericValue={snapshot.netWorth} suffix=" ﷼" sub="أصول − التزامات" color="var(--gold)" />
        <KpiCard label="💵 نقد متاح" value={`${commas(snapshot.cash)} ﷼`} numericValue={snapshot.cash} sub="رصيد نقدي" color="var(--sky)" />
        <KpiCard label="🏦 ادخار" value={`${commas(snapshot.savings)} ﷼`} numericValue={snapshot.savings} sub={`معدل ${snapshot.savingsRate}%`} color="var(--emerald)" />
        <KpiCard label="📈 استثمارات" value={`${commas(snapshot.investments)} ﷼`} numericValue={snapshot.investments} sub={`معدل ${snapshot.investmentRate}%`} color="var(--purple)" />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard label="📉 ديون" value={`${commas(snapshot.debts)} ﷼`} numericValue={snapshot.debts} sub="التزامات نشطة" color="var(--rose)" />
        <KpiCard label="💸 تدفق الشهر" value={`${commas(snapshot.monthlyCashFlow)} ﷼`} sub={`دخل ${commas(snapshot.monthlyIncome)} − مصروف ${commas(snapshot.monthlyExpense)}`} color="var(--teal)" />
        <KpiCard label="🎯 الحرية المالية" value={`${snapshot.fiProgress}%`} numericValue={snapshot.fiProgress} suffix="%" sub={`هدف ${commas(snapshot.fiTarget)} ﷼`} color="var(--amber)" />
      </div>

      <Card className="p-4">
        <div className="text-xs font-bold text-text3 mb-2">تقدّم الاستقلال المالي</div>
        <ProgressBar value={snapshot.fiProgress} color="var(--gold)" />
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm font-bold mb-3">تدفق نقدي (6 أشهر)</div>
          <MiniChart
            type="bar"
            color="var(--emerald)"
            height={120}
            data={snapshot.cashFlowTrend.map((c) => ({ label: c.month.slice(5), value: Math.max(0, c.net) }))}
          />
        </Card>
        <Card className="p-4">
          <div className="text-sm font-bold mb-3">توزيع الثروة</div>
          <MiniChart type="bar" color="var(--gold)" height={120} data={pieData} />
          <div className="flex flex-wrap gap-2 mt-3">
            {snapshot.allocation.map((a) => (
              <span key={a.label} className="text-[10px] px-2 py-1 rounded-full bg-surface2 border border-border">
                {a.label} {a.pct}%
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
