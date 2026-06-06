"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageTransition } from "@/components/motion/motion";

export default function AdminSystemPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin?action=stats").then((r) => r.json()),
      fetch("/api/v1/dashboard").then((r) => (r.ok ? r.json() : null)),
    ]).then(([stats, dashboard]) => {
      setHealth({
        stats,
        dashboardApi: dashboard ? "ok" : "error",
        build: "production",
        database: "supabase",
      });
    });
  }, []);

  return (
    <PageTransition>
      <h1 className="text-lg font-bold text-gold2 mb-4">صحة النظام</h1>
      <Card className="p-4">
        <pre className="text-xs font-mono text-text2 overflow-auto">
          {JSON.stringify(health, null, 2)}
        </pre>
      </Card>
    </PageTransition>
  );
}
