"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";
import { useState } from "react";
import { ViewSkeleton } from "@/components/ui/skeleton";

const GoalsView = dynamic(
  () => import("@/components/dashboard/goals-view").then((m) => ({ default: m.GoalsView })),
  { loading: () => <ViewSkeleton />, ssr: false }
);

export default function GoalsPage() {
  const { data, refresh } = useLifeOS();
  const [openAdd, setOpenAdd] = useState(false);

  if (!data) return null;

  return (
    <>
      <Topbar addLabel="+ هدف" onAdd={() => setOpenAdd(true)} />
      <div className="flex-1 overflow-y-auto p-4 md:p-7 animate-page-in">
        <GoalsView
          yearData={data.yearData}
          onRefresh={refresh}
          openAdd={openAdd}
          onAddClose={() => setOpenAdd(false)}
        />
      </div>
    </>
  );
}
