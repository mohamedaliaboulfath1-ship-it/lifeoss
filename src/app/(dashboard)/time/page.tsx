"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";

const TimeIntelligenceView = dynamic(
  () => import("@/components/time/time-intelligence-view").then((m) => m.TimeIntelligenceView),
  { ssr: false, loading: () => <div className="h-64 skeleton-shimmer rounded-[10px] m-7" /> }
);

export default function TimePage() {
  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-7">
        <TimeIntelligenceView />
      </div>
    </>
  );
}
