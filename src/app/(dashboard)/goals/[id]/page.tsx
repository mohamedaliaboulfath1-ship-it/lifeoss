"use client";

import dynamic from "next/dynamic";
import { use } from "react";
import { Topbar } from "@/components/layout/topbar";

const GoalCommandCenter = dynamic(
  () => import("@/components/goals/goal-command-center").then((m) => m.GoalCommandCenter),
  { loading: () => <div className="h-64 skeleton-shimmer rounded-[10px]" /> }
);

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <GoalCommandCenter goalId={id} />
      </div>
    </>
  );
}
