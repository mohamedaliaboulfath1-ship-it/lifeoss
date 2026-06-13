"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { NAV_PAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getFavorites } from "@/lib/navigation-store";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MOTION } from "@/lib/motion";
import { modalBackdrop } from "@/lib/motion/modal";
import { useRoutePrefetch } from "@/hooks/use-route-prefetch";

interface SidebarProps {
  userName: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  currentYear: string;
  years: string[];
  habitCount?: number;
  onYearChange: (year: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function UserAvatar({ name, avatarUrl, size = 34 }: { name: string; avatarUrl?: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-full shrink-0 object-cover"
        loading="lazy"
        unoptimized
      />
    );
  }
  return (
    <div
      className="rounded-full shrink-0 bg-gradient-to-br from-gold to-sky flex items-center justify-center font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.44 }}
    >
      {name.charAt(0)}
    </div>
  );
}

export function Sidebar({
  userName,
  avatarUrl,
  isAdmin = false,
  currentYear,
  years,
  habitCount = 0,
  onYearChange,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const prefetchRoute = useRoutePrefetch();
  const [favorites, setFavorites] = useState<ReturnType<typeof getFavorites>>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, [pathname]);

  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sections = [...new Set(NAV_PAGES.map((p) => p.section).filter(Boolean))];

  const dateStr = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const yearOptions = [
    ...new Set([currentYear, ...years, String(new Date().getFullYear())]),
  ].sort((a, b) => b.localeCompare(a));

  const content = (
    <>
      <div className="px-[18px] pt-[22px] pb-4 border-b border-border flex items-start justify-between">
        <div>
          <div className="font-display text-xl font-black bg-gradient-to-br from-gold via-sky2 to-gold3 bg-clip-text text-transparent">
            🏛️ Life OS
          </div>
          <div className="text-[10px] text-text3 tracking-[1px] mt-0.5 font-mono">
            نظام تشغيل الحياة · {currentYear}
          </div>
        </div>
        {onMobileClose && (
          <button
            type="button"
            className="md:hidden p-1.5 rounded-sm hover:bg-surface2 focus-ring"
            onClick={onMobileClose}
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <Link
        href="/account/profile"
        onClick={onMobileClose}
        className="px-[18px] py-3.5 border-b border-border flex items-center gap-2.5 hover:bg-surface2/50 transition-colors"
      >
        <UserAvatar name={userName} avatarUrl={avatarUrl} />
        <div className="min-w-0">
          <div className="text-[13px] font-bold truncate">{userName}</div>
          <div className="text-[10px] text-text3 font-mono">{dateStr}</div>
        </div>
      </Link>

      <div className="px-[18px] py-2.5 border-b border-border flex gap-1.5 flex-wrap">
        {yearOptions.slice(0, 4).map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onYearChange(y)}
            className={cn(
              "flex-1 min-w-[60px] py-1.5 rounded-sm font-mono text-[11px] border transition-all cursor-pointer focus-ring",
              y === currentYear
                ? "bg-gold/15 border-gold text-gold2"
                : "bg-surface2 border-border text-text2 hover:border-border2 hover:text-text"
            )}
          >
            {y}
          </button>
        ))}
      </div>

      {favorites.length > 0 && (
        <div className="py-2 border-b border-border">
          <div className="text-[9px] font-bold text-text3 tracking-[2px] uppercase px-[18px] pb-1.5">
            مفضّلة
          </div>
          {favorites.map((f) => {
            const active = pathname.startsWith(f.href);
            return (
              <Link
                key={f.href}
                href={f.href}
                onClick={onMobileClose}
                onMouseEnter={() => prefetchRoute(f.href)}
                className={cn(
                  "flex items-center gap-2 px-[18px] py-1.5 text-[12px] border-r-[3px] transition-all",
                  active
                    ? "bg-gold/7 text-gold2 border-r-gold"
                    : "text-text2 border-r-transparent hover:bg-surface2 hover:text-text"
                )}
              >
                <span className="text-[14px]">{f.icon ?? "⭐"}</span>
                {f.title}
              </Link>
            );
          })}
        </div>
      )}

      <nav className="flex-1 py-2 overflow-y-auto">
        {sections.map((section) => (
          <div key={section} className="py-2">
            <div className="text-[9px] font-bold text-text3 tracking-[2px] uppercase px-[18px] pb-1.5">
              {section}
            </div>
            {NAV_PAGES.filter((p) => p.section === section).map((page) => {
              const active = pathname.startsWith(page.href);
              return (
                <Link
                  key={page.id}
                  href={page.href}
                  onClick={onMobileClose}
                  onMouseEnter={() => prefetchRoute(page.href)}
                  className={cn(
                    "relative flex items-center gap-2 px-[18px] py-2 text-[13px] min-h-[40px] transition-colors",
                    active ? "text-gold2" : "text-text2 hover:text-text"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-gold/7 border-r-[3px] border-r-gold"
                      transition={MOTION.spring.soft}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2 w-full">
                    <span className="text-[15px] w-[19px] text-center">{page.icon}</span>
                    {page.title}
                    {page.id === "habits" && habitCount > 0 && (
                      <span className="mr-auto bg-border text-text3 text-[9px] px-1.5 rounded-full font-mono">
                        {habitCount}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto px-[18px] py-3.5 border-t border-border space-y-1">
        <Link
          href="/account/profile"
          onClick={onMobileClose}
          className="flex items-center gap-2 px-2 py-2 rounded-sm text-[12px] text-text2 hover:bg-surface2 hover:text-text transition-colors min-h-[40px]"
        >
          <span>👤</span> مركز الحساب
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            onClick={onMobileClose}
            className="flex items-center gap-2 px-2 py-2 rounded-sm text-[12px] text-gold2 hover:bg-gold/10 transition-colors min-h-[40px]"
          >
            <span>🛡️</span> لوحة الأدمن
          </Link>
        )}
        <div className="text-[10px] text-emerald font-mono flex items-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald save-dot" />
          متزامن مع Supabase
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={handleSignOut}
        >
          تسجيل الخروج
        </Button>
      </div>
    </>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[190] bg-black/50 md:hidden backdrop-blur-[2px]"
            onClick={onMobileClose}
            aria-hidden
            initial={modalBackdrop.initial}
            animate={modalBackdrop.animate}
            exit={modalBackdrop.exit}
            transition={modalBackdrop.transition}
          />
        )}
      </AnimatePresence>
      <aside
        className={cn(
          "shrink-0 bg-surface border-l border-border flex flex-col overflow-hidden relative z-[195]",
          "w-[var(--width-sidebar)]",
          "fixed md:static inset-y-0 right-0",
          "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:translate-x-0",
          mobileOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}
      >
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
        {content}
      </aside>
    </>
  );
}
