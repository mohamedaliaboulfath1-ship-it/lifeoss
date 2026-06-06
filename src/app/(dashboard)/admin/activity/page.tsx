"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageTransition } from "@/components/motion/motion";

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    fetch("/api/admin?action=activity")
      .then((r) => r.json())
      .then((j) => setLogs(j.logs ?? []));
  }, []);

  return (
    <PageTransition>
      <h1 className="text-lg font-bold text-gold2 mb-4">سجل النشاط</h1>
      <Card className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-text3 text-sm">لا سجلات بعد</p>
        ) : (
          logs.map((log) => (
            <div
              key={String(log.id)}
              className="text-xs border-b border-border/40 pb-2 font-mono"
            >
              <span className="text-gold2">{String(log.action)}</span> ·{" "}
              {String(log.created_at)} · {String(log.entity_type ?? "")}
            </div>
          ))
        )}
      </Card>
    </PageTransition>
  );
}
