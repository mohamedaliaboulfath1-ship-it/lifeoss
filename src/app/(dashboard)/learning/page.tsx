"use client";

import { Topbar } from "@/components/layout/topbar";
import { LearningHubView } from "@/components/dashboard/learning-hub-view";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function LearningPage() {
  const { data, refresh } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <LearningHubView
          yearData={data.yearData}
          onRefresh={refresh}
        />
      </div>
    </>
  );
}
