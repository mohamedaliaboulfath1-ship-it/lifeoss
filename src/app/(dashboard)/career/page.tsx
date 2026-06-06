"use client";

import { CareerHubView } from "@/components/dashboard/career-hub-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function CareerPage() {
  const { data, refresh } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <CareerHubView
          yearData={data.yearData}
          onRefresh={refresh}
        />
      </div>
    </>
  );
}
