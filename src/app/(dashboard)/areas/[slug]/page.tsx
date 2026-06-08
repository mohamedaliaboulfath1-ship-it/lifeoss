"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { use } from "react";

const AreaHubView = dynamic(
  () => import("@/components/areas/area-hub-view").then((m) => m.AreaHubView),
  { ssr: false, loading: () => <div className="h-48 skeleton-shimmer rounded-[10px]" /> }
);

export default function AreaSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <AreaHubView slug={slug} />
      </div>
    </>
  );
}
