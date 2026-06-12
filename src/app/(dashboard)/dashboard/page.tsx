"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOSData, useLifeOSActions } from "@/contexts/lifeos-context";
import { useState } from "react";
import { ImportDialog } from "@/components/dashboard/import-dialog";
import { DashboardSkeleton } from "@/components/ui/skeleton";

const DashboardView = dynamic(
  () => import("@/components/dashboard/dashboard-view").then((m) => m.DashboardView),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />,
  }
);

export default function DashboardPage() {
  const { data, loading } = useLifeOSData();
  const { refresh } = useLifeOSActions();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <Topbar onImport={() => setImportOpen(true)} />
      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-7 animate-page-in">
        {loading && !data ? (
          <DashboardSkeleton />
        ) : data ? (
          <DashboardView
            profile={data.profile!}
            yearData={data.yearData}
            dashboard={data.dashboard}
            onRefresh={refresh}
          />
        ) : null}
      </div>
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={refresh}
      />
    </>
  );
}
