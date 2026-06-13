"use client";

import { Button } from "@/components/ui/button";
import { getPageMeta, NAV_PAGES } from "@/lib/constants";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationsPanel } from "@/components/layout/notifications-panel";
import { ProfileMenu } from "@/components/layout/profile-menu";
import Link from "next/link";
import { Menu } from "lucide-react";
import { toggleFavorite, isFavorite } from "@/lib/navigation-store";
import { useState } from "react";
import { useMobileNav } from "@/contexts/mobile-nav-context";
import { GlassNavbar } from "@/components/glass";

interface TopbarProps {
  onImport?: () => void;
  onAdd?: () => void;
  addLabel?: string;
}

export function Topbar({ onImport, onAdd, addLabel = "+ إضافة" }: TopbarProps) {
  const { open: openMobileNav } = useMobileNav();
  const pathname = usePathname();
  const page = getPageMeta(pathname);
  const [fav, setFav] = useState(() => isFavorite(pathname));

  const section = NAV_PAGES.find((p) => pathname.startsWith(p.href))?.section;

  return (
    <GlassNavbar className="px-4 md:px-7 py-3 sticky top-0 z-50 shrink-0 relative">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button
          type="button"
          onClick={openMobileNav}
          className="md:hidden p-2 rounded-sm hover:bg-surface2 focus-ring shrink-0"
          aria-label="فتح القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-xl md:text-[22px] shrink-0">{page.icon}</span>
        <div className="min-w-0">
          <nav className="text-[10px] text-text3 flex items-center gap-1 mb-0.5 truncate" aria-label="مسار التنقل">
            <Link href="/dashboard" className="hover:text-gold2 transition-colors">
              الرئيسية
            </Link>
            {section && (
              <>
                <span>/</span>
                <span>{section}</span>
              </>
            )}
            <span>/</span>
            <span className="text-text2">{page.title}</span>
          </nav>
          <h1 className="text-base md:text-[17px] font-extrabold truncate">{page.title}</h1>
          <p className="text-[10px] md:text-[11px] text-text3 font-mono truncate hidden sm:block">
            {page.sub}
          </p>
        </div>
        <button
          type="button"
          className="hidden sm:flex text-lg opacity-60 hover:opacity-100 transition-opacity focus-ring rounded-sm px-1"
          title={fav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          onClick={() => setFav(toggleFavorite(pathname, page.title, page.icon))}
          aria-label={fav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        >
          {fav ? "★" : "☆"}
        </button>
      </div>
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <GlobalSearch />
        <NotificationsPanel />
        <ProfileMenu />
        {onImport && (
          <Button variant="ghost" onClick={onImport} className="hidden md:inline-flex">
            📥 استيراد
          </Button>
        )}
        {onAdd && (
          <Button variant="gold" onClick={onAdd} size="sm" className="md:text-xs">
            {addLabel}
          </Button>
        )}
      </div>
    </GlassNavbar>
  );
}
