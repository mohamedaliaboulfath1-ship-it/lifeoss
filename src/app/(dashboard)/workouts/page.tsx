"use client";

import { WorkoutsView } from "@/components/dashboard/workouts-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function WorkoutsPage() {
  const { data, refresh } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <WorkoutsView
          yearData={data.yearData}
          workoutProgram={data.profile.bodyPlan?.workoutProgram}
          onRefresh={refresh}
        />
      </div>
    </>
  );
}
