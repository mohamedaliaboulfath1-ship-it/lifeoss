"use client";

import { ArchiveView } from "@/components/dashboard/archive-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function ArchivePage() {
  const { data, refresh } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <ArchiveView
          currentYear={data.currentYear}
          years={data.years}
          onRefresh={refresh}
        />
      </div>
    </>
  );
}
