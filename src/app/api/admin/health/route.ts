import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

const CORE_TABLES = [
  "profiles",
  "goals",
  "habits",
  "life_tasks",
  "books",
  "exercises",
  "workout_set_logs",
  "meal_logs",
  "foods",
  "para_resources",
  "learning_paths",
  "study_sessions",
  "investments",
  "subscriptions",
  "time_blocks",
  "user_time_settings",
  "workout_templates",
] as const;

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const start = Date.now();
  const tableStats: Record<string, number | string> = {};
  const errors: string[] = [];

  await Promise.all(
    CORE_TABLES.map(async (table) => {
      const t0 = Date.now();
      const { count, error } = await authResult.supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) {
        tableStats[table] = "missing";
        if (!error.message.includes("does not exist")) {
          errors.push(`${table}: ${error.message}`);
        }
      } else {
        tableStats[table] = count ?? 0;
      }
      tableStats[`${table}_ms`] = Date.now() - t0;
    })
  );

  const latencyMs = Date.now() - start;
  const missingTables = CORE_TABLES.filter((t) => tableStats[t] === "missing");

  return NextResponse.json({
    status: errors.length ? "degraded" : missingTables.length > 3 ? "partial" : "operational",
    latencyMs,
    timestamp: new Date().toISOString(),
    tables: tableStats,
    missingTables,
    errors,
    migrations: {
      recommended: ["013", "014", "015", "016", "017", "018"],
      note: missingTables.length
        ? `جداول مفقودة: ${missingTables.join(", ")} — شغّل migrations في Supabase`
        : "جميع الجداول الأساسية متاحة",
    },
  });
}
