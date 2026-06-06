"use client";

import { Topbar } from "@/components/layout/topbar";
import { ExecutiveView } from "@/components/dashboard/executive-view";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function ExecutivePage() {
  const { data } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <ExecutiveView dashboard={data.dashboard} yearData={data.yearData} />
      </div>
    </>
  );
}
