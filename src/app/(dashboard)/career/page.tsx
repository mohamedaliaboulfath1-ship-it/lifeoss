"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

const CareerOsView = dynamic(
  () => import("@/components/career/career-os-view").then((m) => m.CareerOsView),
  { ssr: false, loading: () => <div className="h-48 skeleton-shimmer rounded-[10px]" /> }
);

export default function CareerPage() {
  const { data, refresh } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <CareerOsView yearData={data.yearData} onRefresh={refresh} />
      </div>
    </>
  );
}
