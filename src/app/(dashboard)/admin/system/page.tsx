"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageTransition } from "@/components/motion/motion";

const MIGRATIONS = [
  { id: "013", file: "013_wealth_management.sql", feature: "Wealth Management" },
  { id: "014", file: "014_para_habit_system.sql", feature: "PARA + Habits + Resources" },
  { id: "015", file: "015_body_system_v11.sql", feature: "Body V1.1" },
  { id: "016", file: "016_career_hub_v2.sql", feature: "Career Hub V2" },
  { id: "017", file: "017_time_intelligence.sql", feature: "Time Intelligence" },
  { id: "018", file: "018_habit_scheduling.sql", feature: "Habit Scheduling" },
];

const DOCS = [
  { title: "Areas V2", path: "AREAS_V2_DELIVERABLES.md" },
  { title: "Body V1.1", path: "BODY_V11_DELIVERABLES.md" },
  { title: "Habits V1.1", path: "HABITS_V11_DELIVERABLES.md" },
  { title: "Time V1.1", path: "TIME_V11_DELIVERABLES.md" },
  { title: "Career V2", path: "CAREER_V2_DELIVERABLES.md" },
  { title: "Arabic Seed", path: "MOHAMED_ARABIC_SEED.md" },
  { title: "LifeOS V2", path: "LIFEOS_V2_DELIVERABLES.md" },
  { title: "Deployment", path: "DEPLOYMENT_GUIDE.md" },
  { title: "Enterprise Audit", path: "LIFEOS_ENTERPRISE_AUDIT.md" },
];

const MODULES = [
  { name: "Life Map", href: "/life-map", status: "V2" },
  { name: "Areas Command", href: "/areas", status: "V2" },
  { name: "Journal OS", href: "/journal", status: "V1" },
  { name: "Time Planner", href: "/planner", status: "V1.1" },
  { name: "Wealth", href: "/finance", status: "V1.1" },
  { name: "Career OS", href: "/career", status: "V2" },
  { name: "Body Coach", href: "/body", status: "V1.1" },
  { name: "AI Coach", href: "/ai", status: "Partial" },
];

type HealthProbe = {
  status?: string;
  latencyMs?: number;
  tables?: Record<string, number | string>;
  missingTables?: string[];
};

export default function AdminSystemPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [dbProbe, setDbProbe] = useState<HealthProbe | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin?action=stats").then((r) => r.json()),
      fetch("/api/v1/dashboard").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/health").then((r) => (r.ok ? r.json() : null)),
    ]).then(([stats, dashboard, probe]) => {
      setDbProbe(probe as HealthProbe | null);
      setHealth({
        stats,
        dashboardApi: dashboard ? "ok" : "unavailable",
        dbStatus: (probe as HealthProbe)?.status ?? "unknown",
        production: "https://lifeoss-nine.vercel.app",
        database: "Supabase zxwsbjrqggjpqhtwjvby",
        nodeEnv: process.env.NODE_ENV,
      });
    });
  }, []);

  return (
    <PageTransition>
      <h1 className="text-lg font-bold text-gold2 mb-2">مركز توثيق النظام</h1>
      <p className="text-sm text-text3 mb-6">System Documentation Center — Admin Console</p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4 glass-premium">
          <div className="text-sm font-bold mb-3">📦 الوحدات</div>
          <div className="space-y-1">
            {MODULES.map((m) => (
              <Link key={m.href} href={m.href} className="flex justify-between text-sm py-1 hover:text-gold2">
                <span>{m.name}</span>
                <span className="text-[10px] text-text3">{m.status}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-4 glass-premium">
          <div className="text-sm font-bold mb-3">📄 التوثيق (في المستودع)</div>
          <div className="space-y-1">
            {DOCS.map((d) => (
              <div key={d.path} className="text-sm text-text2 font-mono text-xs py-0.5">
                {d.title} → <span className="text-gold2">{d.path}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4 glass-premium mb-4">
        <div className="text-sm font-bold mb-3">🗄️ Migrations المطلوبة (Supabase SQL Editor)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text3 border-b border-border">
                <th className="text-right py-2">#</th>
                <th className="text-right py-2">الملف</th>
                <th className="text-right py-2">الميزة</th>
              </tr>
            </thead>
            <tbody>
              {MIGRATIONS.map((m) => (
                <tr key={m.id} className="border-b border-border/40">
                  <td className="py-2 font-mono">{m.id}</td>
                  <td className="py-2 font-mono text-gold2">supabase/migrations/{m.file}</td>
                  <td className="py-2">{m.feature}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {dbProbe?.tables && (
        <Card className="p-4 glass-premium mb-4">
          <div className="text-sm font-bold mb-3">🗃️ Database Explorer</div>
          <div className="text-xs text-text3 mb-2">
            الحالة: <span className="text-gold2">{dbProbe.status}</span>
            {dbProbe.latencyMs != null && ` · ${dbProbe.latencyMs}ms`}
          </div>
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text3 border-b border-border">
                  <th className="text-right py-1">جدول</th>
                  <th className="text-right py-1">صفوف</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(dbProbe.tables)
                  .filter(([k]) => !k.endsWith("_ms"))
                  .map(([table, count]) => (
                    <tr key={table} className="border-b border-border/30">
                      <td className="py-1 font-mono">{table}</td>
                      <td className="py-1 text-gold2">{count === "missing" ? "❌" : count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {dbProbe.missingTables && dbProbe.missingTables.length > 0 && (
            <div className="text-xs text-rose mt-2">
              migrations مطلوبة: {dbProbe.missingTables.join(", ")}
            </div>
          )}
        </Card>
      )}

      <Card className="p-4 glass-premium">
        <div className="text-sm font-bold mb-2">💚 صحة النظام</div>
        <pre className="text-xs font-mono text-text2 overflow-auto max-h-64">
          {JSON.stringify(health, null, 2)}
        </pre>
      </Card>
    </PageTransition>
  );
}
