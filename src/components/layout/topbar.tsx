"use client";

import { Button } from "@/components/ui/button";
import { getPageMeta } from "@/lib/constants";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationsPanel } from "@/components/layout/notifications-panel";

interface TopbarProps {
  onImport?: () => void;
  onAdd?: () => void;
  addLabel?: string;
}

export function Topbar({ onImport, onAdd, addLabel = "+ إضافة" }: TopbarProps) {
  const pathname = usePathname();
  const page = getPageMeta(pathname);

  return (
    <header className="px-7 py-3.5 border-b border-border flex items-center justify-between bg-bg/80 backdrop-blur-xl sticky top-0 z-50 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[22px]">{page.icon}</span>
        <div>
          <h1 className="text-[17px] font-extrabold">{page.title}</h1>
          <p className="text-[11px] text-text3 font-mono">{page.sub}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <GlobalSearch />
        <NotificationsPanel />
        {onImport && (
          <Button variant="ghost" onClick={onImport}>
            📥 استيراد
          </Button>
        )}
        {onAdd && (
          <Button variant="gold" onClick={onAdd}>
            {addLabel}
          </Button>
        )}
      </div>
    </header>
  );
}
