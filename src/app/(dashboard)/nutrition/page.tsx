"use client";

import { NutritionView } from "@/components/dashboard/nutrition-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function NutritionPage() {
  const { data, refresh } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <NutritionView
          yearData={data.yearData}
          targets={{
            calories: data.profile.dailyCalories ?? 3000,
            protein: data.profile.proteinTarget ?? 130,
            carbs: data.profile.carbsTarget ?? 350,
            fats: data.profile.fatsTarget ?? 90,
          }}
          bodyPlan={data.profile.bodyPlan}
          onEditPlan={() => { window.location.href = "/body"; }}
          onRefresh={refresh}
        />
      </div>
    </>
  );
}
