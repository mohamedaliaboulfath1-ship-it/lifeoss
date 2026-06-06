"use client";

import { ReviewsView } from "@/components/dashboard/reviews-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function ReviewsPage() {
  const { data } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <ReviewsView
          yearData={data.yearData}
        />
      </div>
    </>
  );
}
