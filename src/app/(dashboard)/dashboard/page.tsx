"use client";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOSData } from "@/hooks/use-lifeos-data";
import { useState } from "react";
import { ImportDialog } from "@/components/dashboard/import-dialog";

export default function DashboardPage() {
  const { data } = useLifeOSData();
  const [importOpen, setImportOpen] = useState(false);

  if (!data) return null;

  return (
    <>
      <Topbar onImport={() => setImportOpen(true)} />
      <div className="flex-1 overflow-y-auto p-7 animate-fade-up">
        <DashboardView
          profile={data.profile!}
          yearData={data.yearData}
        />
      </div>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
