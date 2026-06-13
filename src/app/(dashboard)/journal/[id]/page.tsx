"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { ViewSkeleton } from "@/components/ui/skeleton";
import { use } from "react";

const JournalEditorView = dynamic(
  () => import("@/components/journal/journal-editor-view").then((m) => m.JournalEditorView),
  { loading: () => <ViewSkeleton />, ssr: false }
);

export default function JournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-7 animate-page-in">
        <JournalEditorView entryId={id} />
      </div>
    </>
  );
}
