"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";
import { useState } from "react";
import { ViewSkeleton } from "@/components/ui/skeleton";

const HabitsView = dynamic(
  () => import("@/components/dashboard/habits-view").then((m) => ({ default: m.HabitsView })),
  { loading: () => <ViewSkeleton />, ssr: false }
);

export default function HabitsPage() {
  const { data } = useLifeOS();
  const [showAdd, setShowAdd] = useState(false);

  if (!data) return null;

  return (
    <>
      <Topbar addLabel="+ عادة" onAdd={() => setShowAdd(true)} />
      <div className="flex-1 overflow-y-auto p-4 md:p-7 animate-page-in">
        <HabitsView
          yearData={data.yearData}
          forceAddModal={showAdd}
          onAddModalClose={() => setShowAdd(false)}
        />
      </div>
    </>
  );
}
