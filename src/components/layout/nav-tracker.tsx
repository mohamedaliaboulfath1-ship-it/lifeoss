"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getPageMeta } from "@/lib/constants";
import { trackPageVisit } from "@/lib/navigation-store";

export function NavTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const page = getPageMeta(pathname);
    trackPageVisit(pathname, page.title, page.icon);
  }, [pathname]);

  return null;
}
