#!/usr/bin/env node
/**
 * Delete duplicate auth user (keeps admin account).
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/delete-duplicate-user.mjs
 */
import { createClient } from "@supabase/supabase-js";

const USER_TO_DELETE = "c18e622d-fc63-44ca-a0f3-1da16003b875";
const KEEP_ADMIN = "1f1fa641-b3b4-4d3b-8b76-f78d2a85ae0c";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("❌ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  console.error("   Supabase → Project Settings → API → service_role (secret)");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("LifeOS — delete duplicate user\n");
console.log(`  DELETE: ${USER_TO_DELETE}`);
console.log(`  KEEP:   ${KEEP_ADMIN}\n`);

const { data: before, error: listErr } = await admin.auth.admin.listUsers({
  perPage: 100,
});
if (listErr) {
  console.error("❌ listUsers:", listErr.message);
  process.exit(1);
}

const targets = before.users.filter((u) =>
  [USER_TO_DELETE, KEEP_ADMIN].includes(u.id)
);
console.log("Accounts before delete:");
for (const u of targets) {
  console.log(`  - ${u.id}  ${u.email}`);
}

const { error: delErr } = await admin.auth.admin.deleteUser(USER_TO_DELETE);
if (delErr) {
  console.error("❌ deleteUser:", delErr.message);
  process.exit(1);
}

const { data: after } = await admin.auth.admin.listUsers({ perPage: 100 });
const remaining = after.users.filter(
  (u) => u.email === "mohamedaliaboulfath1@gmail.com"
);

console.log("\n✓ Deleted successfully");
console.log("Remaining accounts for email:");
for (const u of remaining) {
  console.log(`  - ${u.id}  ${u.email}`);
}

const { data: profile } = await admin
  .from("profiles")
  .select("id, display_name, role")
  .eq("id", KEEP_ADMIN)
  .single();

if (profile) {
  console.log(`\nAdmin profile: ${profile.display_name} (${profile.role})`);
} else {
  console.warn("\n⚠ Admin profile row not found — may need manual insert");
}
