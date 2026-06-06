#!/usr/bin/env node
/**
 * Run Supabase SQL migrations (001–007).
 * Requires SUPABASE_DB_URL in environment, e.g.:
 * postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ Set SUPABASE_DB_URL or DATABASE_URL to run migrations.");
  console.error("   Supabase → Project Settings → Database → Connection string (URI)");
  process.exit(1);
}

let pg;
try {
  pg = await import("pg");
} catch {
  console.error("❌ Install pg: npm install --save-dev pg");
  process.exit(1);
}

const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

try {
  await client.connect();
  console.log(`✓ Connected — running ${files.length} migration files\n`);

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    process.stdout.write(`→ ${file} ... `);
    try {
      await client.query(sql);
      console.log("OK");
    } catch (err) {
      console.log("FAILED");
      console.error(`  ${err.message}`);
      if (!err.message.includes("already exists")) throw err;
      console.log("  (continuing — object may already exist)");
    }
  }

  const { rows } = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);

  console.log(`\n✓ Public tables (${rows.length}):`);
  rows.forEach((r) => console.log(`  - ${r.table_name}`));
} finally {
  await client.end();
}
