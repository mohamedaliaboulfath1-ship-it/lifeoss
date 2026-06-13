"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOSData } from "@/contexts/lifeos-context";
import { ViewSkeleton } from "@/components/ui/skeleton";

const WealthFinanceView = dynamic(
  () =>
    import("@/components/finance/wealth-finance-view").then((m) => ({
      default: m.WealthFinanceView,
    })),
  { loading: () => <ViewSkeleton />, ssr: false }
);

export default function FinancePage() {
  const { data } = useLifeOSData();
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
