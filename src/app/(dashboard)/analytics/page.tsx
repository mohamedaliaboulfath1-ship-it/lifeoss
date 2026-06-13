"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOSData } from "@/contexts/lifeos-context";
import { ViewSkeleton } from "@/components/ui/skeleton";

const AnalyticsView = dynamic(
  () =>
    import("@/components/dashboard/analytics-view").then((m) => ({
      default: m.AnalyticsView,
    })),
  { loading: () => <ViewSkeleton />, ssr: false }
);

export default function AnalyticsPage() {
  const { data } = useLifeOSData();
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
