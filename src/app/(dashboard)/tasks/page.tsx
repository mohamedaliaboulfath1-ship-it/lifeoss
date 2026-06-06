"use client";

import { TasksView } from "@/components/dashboard/tasks-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function TasksPage() {
  const { data, refresh } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <TasksView
          yearData={data.yearData}
          onRefresh={refresh}
        />
      </div>
    </>
  );
}
