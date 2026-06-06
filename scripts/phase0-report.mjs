#!/usr/bin/env node
/** Phase 0 delivery report — tables from migrations + test backup stats */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");
const backup = JSON.parse(
  readFileSync(join(__dirname, "test-backup.json"), "utf8")
);

const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
const allSql = files.map((f) => readFileSync(join(migrationsDir, f), "utf8")).join("\n");

const created = [...allSql.matchAll(/create table (?:if not exists )?public\.(\w+)/gi)].map(
  (m) => m[1]
);
const altered = [...allSql.matchAll(/alter table public\.(\w+)/gi)].map((m) => m[1]);

console.log("═══ LifeOS Phase 0 Report ═══\n");
console.log("Migration files:", files.join(", "));
console.log("\nNew tables (CREATE):", [...new Set(created)].length);
[...new Set(created)].sort().forEach((t) => console.log(`  • ${t}`));
console.log("\nExtended tables (ALTER):", [...new Set(altered)].length);
[...new Set(altered)].sort().forEach((t) => console.log(`  • ${t}`));

const stores = [
  "settings", "goals", "habits", "habit_logs", "tasks", "weight_logs",
  "measurements", "progress_photos", "exercises", "workout_logs", "foods",
  "meals", "meal_logs", "books", "reading_logs", "transactions", "budgets",
  "debts", "daily_journals", "weekly_reviews", "monthly_reviews", "archive",
];

console.log("\nTest backup (scripts/test-backup.json):");
let total = 0;
for (const s of stores) {
  const n = Array.isArray(backup[s]) ? backup[s].length : 0;
  total += n;
  if (n > 0) console.log(`  ${s}: ${n}`);
}
console.log(`  TOTAL: ${total} records across ${stores.filter((s) => (backup[s]?.length ?? 0) > 0).length} stores`);

console.log("\nSkipped by design:");
console.log("  • meals — legacy empty store; data lives in meal_logs");
console.log("  • archive — empty in test backup; maps to yearly_snapshots when present");

console.log("\nTo run migrations:");
console.log("  SUPABASE_DB_URL='postgresql://...' npm run migrate");
console.log("  — or paste supabase/migrations/*.sql in Supabase SQL Editor");
