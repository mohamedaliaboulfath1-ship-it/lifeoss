"use client";

import { GoalsView } from "@/components/dashboard/goals-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";
import { useState } from "react";

export default function GoalsPage() {
  const { data, refresh } = useLifeOS();
  const [openAdd, setOpenAdd] = useState(false);

  if (!data) return null;

  return (
    <>
      <Topbar addLabel="+ هدف" onAdd={() => setOpenAdd(true)} />
      <div className="flex-1 overflow-y-auto p-7">
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
