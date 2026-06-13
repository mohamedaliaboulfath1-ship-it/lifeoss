"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { ViewSkeleton } from "@/components/ui/skeleton";

const JournalHubView = dynamic(
  () => import("@/components/journal/journal-hub-view").then((m) => m.JournalHubView),
  { loading: () => <ViewSkeleton />, ssr: false }
);

export default function JournalPage() {
  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-7 animate-page-in" data-tour="main-content">
        <JournalHubView />
      </div>
    </>
  );
}
