"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="border-b border-border/60 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gold2">{title}</h4>
        {description && <p className="text-[11px] text-text3 mt-0.5">{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
