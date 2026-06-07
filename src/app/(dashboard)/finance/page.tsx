"use client";

import { WealthFinanceView } from "@/components/finance/wealth-finance-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function FinancePage() {
  const { data } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <WealthFinanceView
          yearData={data.yearData}
          salary={data.profile.salary}
        />
      </div>
    </>
  );
}
