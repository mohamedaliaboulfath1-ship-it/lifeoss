"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOSData } from "@/contexts/lifeos-context";
import { ViewSkeleton } from "@/components/ui/skeleton";

const ExecutiveView = dynamic(
  () =>
    import("@/components/dashboard/executive-view").then((m) => ({
      default: m.ExecutiveView,
    })),
  { loading: () => <ViewSkeleton />, ssr: false }
);

export default function ExecutivePage() {
  const { data } = useLifeOSData();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <ExecutiveView dashboard={data.dashboard} yearData={data.yearData} />
      </div>
    </>
  );
}
