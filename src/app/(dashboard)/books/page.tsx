"use client";

import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";
import { ViewSkeleton } from "@/components/ui/skeleton";

const BooksView = dynamic(
  () => import("@/components/dashboard/books-view").then((m) => ({ default: m.BooksView })),
  { loading: () => <ViewSkeleton />, ssr: false }
);

export default function BooksPage() {
  const { data, refresh } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-7 animate-page-in">
        <BooksView yearData={data.yearData} onRefresh={refresh} />
      </div>
    </>
  );
}
