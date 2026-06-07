"use client";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";
import { useState } from "react";
import { ImportDialog } from "@/components/dashboard/import-dialog";

export default function DashboardPage() {
  const { data, refresh } = useLifeOS();
  const [importOpen, setImportOpen] = useState(false);

  if (!data) return null;

  return (
    <>
      <Topbar onImport={() => setImportOpen(true)} />
      <div className="flex-1 overflow-y-auto p-4 md:p-7 animate-page-in">
        <DashboardView
          profile={data.profile!}
          yearData={data.yearData}
          dashboard={data.dashboard}
          onRefresh={refresh}
        />
      </div>
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={refresh}
      />
    </>
  );
}
