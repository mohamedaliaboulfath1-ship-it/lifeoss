"use client";

import { WeightView } from "@/components/dashboard/weight-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function WeightPage() {
  const { data, refresh } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar addLabel="+ وزن" />
      <div className="flex-1 overflow-y-auto p-7">
        <WeightView
          yearData={data.yearData}
          startWeight={data.profile.startWeight}
          targetWeight={data.profile.targetWeight}
          currentWeight={data.profile.currentWeight}
          bodyPlan={data.profile.bodyPlan}
          dailyCalories={data.profile.dailyCalories}
          proteinTarget={data.profile.proteinTarget}
          carbsTarget={data.profile.carbsTarget}
          fatsTarget={data.profile.fatsTarget}
          height={data.profile.height}
          onRefresh={refresh}
        />
      </div>
    </>
  );
}
