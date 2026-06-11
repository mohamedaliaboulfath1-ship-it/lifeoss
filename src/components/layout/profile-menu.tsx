"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useLifeOS } from "@/contexts/lifeos-context";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  { href: "/account/profile", label: "الملف الشخصي", icon: "👤" },
  { href: "/account/security", label: "الأمان", icon: "🔒" },
  { href: "/account/appearance", label: "المظهر", icon: "🎨" },
  { href: "/account/notifications", label: "الإشعارات", icon: "🔔" },
  { href: "/account/privacy", label: "الخصوصية", icon: "🔐" },
  { href: "/account/subscription", label: "الاشتراك", icon: "💎" },
  { href: "/account/export", label: "تصدير البيانات", icon: "📤" },
  { href: "/settings", label: "إعدادات النظام", icon: "⚙️" },
];

function Avatar({ name, url, size = 32 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="rounded-full shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full bg-gradient-to-br from-gold to-sky flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0)}
    </span>
  );
}

export function ProfileMenu() {
  const router = useRouter();
  const { data } = useLifeOS();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = data?.profile.displayName ?? "مستخدم";
  const avatarUrl = data?.profile.avatarUrl;
  const isAdmin = data?.profile.role === "admin";

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-sm border border-border hover:border-border2 transition-colors cursor-pointer"
        aria-label="قائمة الحساب"
      >
        <Avatar name={name} url={avatarUrl} />
        <span className="text-xs font-medium max-w-[100px] truncate hidden sm:inline">
          {name}
        </span>
        <span className="text-text3 text-[10px]">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-surface border border-border2 rounded-[10px] shadow-xl z-[100] py-2 animate-fade-up">
          <div className="px-4 py-2 border-b border-border mb-1 flex items-center gap-2">
            <Avatar name={name} url={avatarUrl} size={36} />
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">{name}</div>
              <div className="text-[10px] text-text3 font-mono">
                {isAdmin ? "مدير النظام" : "مركز الحساب"}
              </div>
            </div>
          </div>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gold2 hover:bg-gold/10 transition-colors"
            >
              <span>🛡️</span>
              لوحة الأدمن
            </Link>
          )}
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2 text-sm text-text2 hover:bg-surface2 hover:text-text transition-colors"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <div className="border-t border-border mt-1 pt-1">
            <button
              type="button"
              onClick={signOut}
              className="w-full text-right flex items-center gap-2.5 px-4 py-2 text-sm text-rose2 hover:bg-rose/10 transition-colors cursor-pointer"
            >
              <span>🚪</span>
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
