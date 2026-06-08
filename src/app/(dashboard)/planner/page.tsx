"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";

const PlannerView = dynamic(
  () => import("@/components/time/planner-view").then((m) => m.PlannerView),
  { ssr: false, loading: () => <div className="h-96 skeleton-shimmer rounded-[10px] m-7" /> }
);

export default function PlannerPage() {
  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-7">
        <PlannerView />
      </div>
    </>
  );
}
