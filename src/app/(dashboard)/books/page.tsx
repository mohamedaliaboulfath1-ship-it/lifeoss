"use client";

import { BooksView } from "@/components/dashboard/books-view";
import { Topbar } from "@/components/layout/topbar";
import { useLifeOS } from "@/contexts/lifeos-context";

export default function BooksPage() {
  const { data, refresh } = useLifeOS();
  if (!data) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <BooksView
          yearData={data.yearData}
          onRefresh={refresh}
        />
      </div>
    </>
  );
}
