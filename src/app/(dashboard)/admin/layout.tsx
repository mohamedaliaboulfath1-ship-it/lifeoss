"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "لوحة المسؤول" },
  { href: "/admin/users", label: "المستخدمون" },
  { href: "/admin/activity", label: "سجل النشاط" },
  { href: "/admin/system", label: "صحة النظام" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin?action=stats")
      .then((r) => {
        if (r.status === 403) {
          setAllowed(false);
          router.replace("/dashboard");
          return null;
        }
        setAllowed(true);
        return r.json();
      })
      .catch(() => {
        setAllowed(false);
        router.replace("/dashboard");
      });
  }, [router]);

  if (allowed === null) {
    return (
      <div className="flex-1 flex items-center justify-center text-text3 text-sm">
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <>
      <Topbar />
      <div className="flex-1 overflow-y-auto p-7">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
          <nav className="md:w-44 shrink-0 space-y-1">
            <h2 className="text-xs text-text3 font-mono mb-3 px-2">Admin</h2>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-3 py-2 rounded-sm text-sm",
                  pathname === item.href
                    ? "bg-gold/15 text-gold2 font-medium"
                    : "text-text2 hover:bg-surface2"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </>
  );
}
