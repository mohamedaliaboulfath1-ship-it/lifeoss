"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface NotificationItem {
  id: string;
  title: string;
  priority?: string;
}

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/v1/ai/insights")
      .then((r) => r.json())
      .then((json) => {
        const list = (json.insights ?? []).map((x: { id: string; title: string; type: string }) => ({
          id: x.id,
          title: x.title,
          priority: x.type,
        }));
        setItems(list);
      })
      .catch(() => setItems([]));
  }, [open]);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen((x) => !x)}>
        🔔
      </Button>
      {open && (
        <div className="fixed top-16 left-6 z-[210] w-[360px]">
          <Card className="p-3 space-y-2 shadow-2xl">
            <div className="text-sm font-bold text-gold2">الإشعارات</div>
            {items.length === 0 && <div className="text-xs text-text3">لا إشعارات حالياً.</div>}
            {items.map((n) => (
              <div key={n.id} className="text-sm border-b border-border/50 pb-2">
                {n.title}
                <div className="text-[10px] text-text3">{n.priority}</div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </>
  );
}
