"use client";

import { AreasIntelligenceView } from "@/components/areas/areas-intelligence-view";
import { Topbar } from "@/components/layout/topbar";

export default function AreasPage() {
  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <AreasIntelligenceView />
      </div>
    </>
  );
}
