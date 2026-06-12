"use client";

import { AreasIntelligenceView } from "@/components/areas/areas-intelligence-view";
import { Topbar } from "@/components/layout/topbar";

export default function AreasPage() {
  return (
    <>
      <Topbar />
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5 md:p-7">
        <AreasIntelligenceView />
      </div>
    </>
  );
}
