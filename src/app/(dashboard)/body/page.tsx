"use client";

import { BodyView } from "@/components/dashboard/body-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function BodyPage() {
  const { data, refresh } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <BodyView
          yearData={data.yearData}
          startWeight={data.profile.startWeight}
          targetWeight={data.profile.targetWeight}
          heightCm={data.profile.height}
          onRefresh={refresh}
        />
      </div>
    </>
  );
}
