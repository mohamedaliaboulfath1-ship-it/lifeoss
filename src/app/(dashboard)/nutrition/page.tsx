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
          targets={{ calories: 3000, protein: 130, carbs: 350, fats: 90 }}
          onRefresh={refresh}
        />
      </div>
    </>
  );
}
