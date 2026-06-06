"use client";

import { HabitsView } from "@/components/dashboard/habits-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";
import { useState } from "react";

export default function HabitsPage() {
  const { data } = useLifeOS();
  const [showAdd, setShowAdd] = useState(false);

  if (!data) return null;

  return (
    <>
      <Topbar addLabel="+ عادة" onAdd={() => setShowAdd(true)} />
      <div className="flex-1 overflow-y-auto p-7">
        <HabitsView
          yearData={data.yearData}
          forceAddModal={showAdd}
          onAddModalClose={() => setShowAdd(false)}
        />
      </div>
    </>
  );
}
