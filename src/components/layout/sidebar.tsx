"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { NAV_PAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  userName: string;
  currentYear: string;
  years: string[];
  habitCount?: number;
  onYearChange: (year: string) => void;
}

export function Sidebar({
  userName,
  currentYear,
  years,
  habitCount = 0,
  onYearChange,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
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

  return (
    <aside className="w-[var(--width-sidebar)] shrink-0 bg-surface border-l border-border flex flex-col overflow-y-auto relative">
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-gold/30 to-transparent" />

      <div className="px-[18px] pt-[22px] pb-4 border-b border-border">
        <div className="font-display text-xl font-black bg-gradient-to-br from-gold to-gold3 bg-clip-text text-transparent">
          LifeOS ✦
        </div>
        <div className="text-[10px] text-text3 tracking-[3px] uppercase mt-0.5 font-mono">
          {currentYear} · PREMIUM
        </div>
      </div>

      <div className="px-[18px] py-3.5 border-b border-border flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-full shrink-0 bg-gradient-to-br from-gold to-purple flex items-center justify-center text-[15px] font-bold text-white">
          {userName.charAt(0)}
        </div>
        <div>
          <div className="text-[13px] font-bold">{userName}</div>
          <div className="text-[10px] text-text3 font-mono">{dateStr}</div>
        </div>
      </div>

      <div className="px-[18px] py-2.5 border-b border-border flex gap-1.5 flex-wrap">
        {yearOptions.slice(0, 4).map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onYearChange(y)}
            className={cn(
              "flex-1 min-w-[60px] py-1.5 rounded-sm font-mono text-[11px] border transition-all cursor-pointer",
              y === currentYear
                ? "bg-gold/15 border-gold text-gold2"
                : "bg-surface2 border-border text-text2 hover:border-border2 hover:text-text"
            )}
          >
            {y}
          </button>
        ))}
      </div>

      <nav className="flex-1 py-2">
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
                  className={cn(
                    "flex items-center gap-2 px-[18px] py-1.5 text-[13px] border-r-[3px] transition-all",
                    active
                      ? "bg-gold/7 text-gold2 border-r-gold"
                      : "text-text2 border-r-transparent hover:bg-surface2 hover:text-text"
                  )}
                >
                  <span className="text-[15px] w-[19px] text-center">{page.icon}</span>
                  {page.title}
                  {page.id === "habits" && habitCount > 0 && (
                    <span className="mr-auto bg-border text-text3 text-[9px] px-1.5 rounded-full font-mono">
                      {habitCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto px-[18px] py-3.5 border-t border-border space-y-2">
        <div className="text-[10px] text-emerald font-mono flex items-center gap-1.5">
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
    </aside>
  );
}
