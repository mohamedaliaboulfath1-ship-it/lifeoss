"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { CareerIntegrations } from "@/lib/career/integration";

interface Props {
  integrations: CareerIntegrations;
}

export function CareerIntegrationsPanel({ integrations }: Props) {
  return (
    <div className="space-y-4">
      {integrations.suggestions.length > 0 && (
        <Card className="p-4 space-y-2">
          <div className="text-sm font-bold text-gold2">اقتراحات المدرب — مرتبطة بمرحلتك</div>
          {integrations.suggestions.map((s) => (
            <Link
              key={s.id}
              href={s.actionUrl ?? "/career"}
              className="block p-2 rounded-sm bg-surface2 border border-border/50 hover:border-gold/30 text-sm"
            >
              {s.icon} <strong>{s.label}</strong>
              <div className="text-xs text-text3">{s.reason}</div>
            </Link>
          ))}
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <IntegrationColumn title="🎯 أهداف مهنية" items={integrations.goals} empty="أضف هدفاً من /goals" />
        <IntegrationColumn title="✅ عادات مرتبطة" items={integrations.habits} empty="اربط عادة بهدف مهني" />
        <IntegrationColumn title="📚 كتب مهنية" items={integrations.books} empty="أضف كتباً من /books" />
      </div>
    </div>
  );
}

function IntegrationColumn({
  title,
  items,
  empty,
}: {
  title: string;
  items: CareerIntegrations["goals"];
  empty: string;
}) {
  return (
    <Card className="p-4 space-y-2">
      <div className="text-xs font-bold">{title}</div>
      {!items.length && <p className="text-[11px] text-text3">{empty}</p>}
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.url ?? "#"}
          className="block p-2 rounded-sm bg-surface2/60 hover:bg-surface2 text-sm"
        >
          <div className="truncate">{item.title}</div>
          {item.progress != null && (
            <ProgressBar value={item.progress} color="var(--sky)" className="h-1 mt-1" />
          )}
          {item.linked && <span className="text-[10px] text-emerald2">مرتبط بالمسار</span>}
        </Link>
      ))}
    </Card>
  );
}
