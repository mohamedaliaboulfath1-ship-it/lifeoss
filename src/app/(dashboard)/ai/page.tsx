"use client";

import { Topbar } from "@/components/layout/topbar";
import { AiCoachView } from "@/components/dashboard/ai-coach-view";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function AiPage() {
  const { data } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <AiCoachView yearData={data.yearData} dashboard={data.dashboard} />
      </div>
    </>
  );
}
