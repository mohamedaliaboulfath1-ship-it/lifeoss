"use client";

import { BodyCoachView } from "@/components/body/body-coach-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function BodyPage() {
  const { data, refresh } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <BodyCoachView
          yearData={data.yearData}
          startWeight={data.profile.startWeight}
          targetWeight={data.profile.targetWeight}
          currentWeight={data.profile.currentWeight}
          heightCm={data.profile.height}
          bodyPlan={data.profile.bodyPlan}
          dailyCalories={data.profile.dailyCalories}
          proteinTarget={data.profile.proteinTarget}
          carbsTarget={data.profile.carbsTarget}
          fatsTarget={data.profile.fatsTarget}
          onRefresh={refresh}
        />
      </div>
    </>
  );
}
