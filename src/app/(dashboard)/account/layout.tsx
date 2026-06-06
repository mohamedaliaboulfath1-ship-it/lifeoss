"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account/profile", label: "الملف الشخصي" },
  { href: "/account/security", label: "الأمان" },
  { href: "/account/appearance", label: "المظهر" },
  { href: "/account/notifications", label: "الإشعارات" },
  { href: "/account/privacy", label: "الخصوصية" },
  { href: "/account/subscription", label: "الاشتراك" },
  { href: "/account/export", label: "تصدير البيانات" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
          <nav className="md:w-48 shrink-0 space-y-1">
            <h2 className="text-xs text-text3 font-mono mb-3 px-2">مركز الحساب</h2>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-3 py-2 rounded-sm text-sm transition-colors",
                  pathname === item.href
                    ? "bg-gold/15 text-gold2 font-medium"
                    : "text-text2 hover:bg-surface2"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </>
  );
}
