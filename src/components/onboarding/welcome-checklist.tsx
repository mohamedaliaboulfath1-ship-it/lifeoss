"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";
import type { WelcomeChecklist } from "@/lib/tenant/constants";
import { defaultWelcomeChecklist } from "@/lib/tenant/constants";

const CHECKLIST_ITEMS: {
  key: keyof WelcomeChecklist;
  label: string;
  href: string;
}[] = [
  { key: "profile", label: "أكمل الملف الشخصي", href: "/account/profile" },
  { key: "goal", label: "أنشئ هدفك الأول", href: "/goals" },
  { key: "habit", label: "أضف عادة", href: "/habits" },
  { key: "task", label: "أضف مهمة", href: "/tasks" },
  { key: "book", label: "أضف كتاباً", href: "/books" },
  { key: "project", label: "أنشئ مشروعاً", href: "/goals" },
  { key: "areaLink", label: "اربط هدفاً بمجال", href: "/areas" },
];

interface WelcomeChecklistProps {
  checklist?: WelcomeChecklist;
  className?: string;
}

export function WelcomeChecklistPanel({
  checklist: initial,
  className,
}: WelcomeChecklistProps) {
  const [checklist, setChecklist] = useState<WelcomeChecklist>(
    initial ?? defaultWelcomeChecklist()
  );

  useEffect(() => {
    if (initial) setChecklist(initial);
  }, [initial]);

  const done = useMemo(
    () => Object.values(checklist).filter(Boolean).length,
    [checklist]
  );
  const total = CHECKLIST_ITEMS.length;
  const pct = Math.round((done / total) * 100);

  async function toggle(key: keyof WelcomeChecklist) {
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_checklist", checklist: { [key]: next[key] } }),
    });
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-text2">التقدّم</span>
        <span className="text-sm font-mono text-gold2">
          {done}/{total} · {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold to-sky2 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => {
          const checked = checklist[item.key];
          return (
            <li key={item.key}>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-surface/50 hover:bg-surface2/50 transition-colors">
                <button
                  type="button"
                  onClick={() => toggle(item.key)}
                  className="shrink-0 focus-ring rounded-full"
                  aria-label={checked ? "إلغاء" : "إكمال"}
                >
                  {checked ? (
                    <Check className="w-5 h-5 text-mint" />
                  ) : (
                    <Circle className="w-5 h-5 text-text3" />
                  )}
                </button>
                <Link
                  href={item.href}
                  className={cn(
                    "flex-1 text-sm",
                    checked ? "text-text3 line-through" : "text-text"
                  )}
                >
                  {item.label}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
