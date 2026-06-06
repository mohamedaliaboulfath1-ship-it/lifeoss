#!/usr/bin/env node
/** LifeOS Pro V1 — smoke / sanity checks (no auth required for structure) */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  console.log(`  ✓ ${label}`);
}
function fail(label, detail = "") {
  failed++;
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
}

console.log("\nLifeOS Pro V1 Smoke Test\n");

const requiredFiles = [
  "src/app/api/v1/analytics/route.ts",
  "src/app/api/v1/search/route.ts",
  "src/app/api/notifications/route.ts",
  "src/app/api/admin/route.ts",
  "src/app/(dashboard)/admin/page.tsx",
  "src/lib/analytics/score-engine.ts",
  "src/lib/ai/provider.ts",
  "supabase/migrations/009_v1_completion.sql",
  "public/manifest.json",
  "public/sw.js",
];

for (const f of requiredFiles) {
  if (existsSync(join(root, f))) ok(f);
  else fail(f, "missing");
}

const migrations = readFileSync(join(root, "supabase/migrations/009_v1_completion.sql"), "utf8");
if (migrations.includes("role") && migrations.includes("book_highlights")) ok("migration 009 content");
else fail("migration 009 content");

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (pkg.dependencies["framer-motion"] && pkg.dependencies["lucide-react"]) ok("motion + icons deps");
else fail("motion + icons deps");

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
