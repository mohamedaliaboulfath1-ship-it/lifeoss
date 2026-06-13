"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { ViewSkeleton } from "@/components/ui/skeleton";

const JournalGraphView = dynamic(
  () => import("@/components/journal/journal-graph-view").then((m) => m.JournalGraphView),
  { loading: () => <ViewSkeleton />, ssr: false }
);

export default function JournalGraphPage() {
  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-7 animate-page-in">
        <JournalGraphView />
      </div>
    </>
  );
}
