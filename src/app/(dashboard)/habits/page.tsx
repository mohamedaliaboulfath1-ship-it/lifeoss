"use client";

import { HabitsView } from "@/components/dashboard/habits-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOSData } from "@/hooks/use-lifeos-data";
import { useState } from "react";

export default function HabitsPage() {
  const { data, refresh } = useLifeOSData();
  const [showAdd, setShowAdd] = useState(false);

  if (!data) return null;

  return (
    <>
      <Topbar addLabel="+ عادة" onAdd={() => setShowAdd(true)} />
      <div className="flex-1 overflow-y-auto p-7">
        <HabitsView
          yearData={data.yearData}
          onRefresh={refresh}
          forceAddModal={showAdd}
          onAddModalClose={() => setShowAdd(false)}
        />
      </div>
    </>
  );
}
