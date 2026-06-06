"use client";

import { AnalyticsView } from "@/components/dashboard/analytics-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function AnalyticsPage() {
  const { data } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <AnalyticsView yearData={data.yearData} />
      </div>
    </>
  );
}
