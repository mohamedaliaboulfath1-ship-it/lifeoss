#!/usr/bin/env npx tsx
/**
 * LifeOS — بذر مكتبة القراءة لمحمد (50 كتاب)
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-mohamed-books-library.ts
 *   npx tsx scripts/seed-mohamed-books-library.ts --force
 *   SEED_USER_EMAIL=you@email.com npx tsx scripts/seed-mohamed-books-library.ts
 */
import { createClient } from "@supabase/supabase-js";
import { runMohamedBooksLibrarySeed } from "../src/lib/seed/run-mohamed-books-library";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const password = process.env.SEED_USER_PASSWORD;
const email = process.env.SEED_USER_EMAIL ?? "mohamedaliabouelfath1@gmail.com";
const force = process.argv.includes("--force");

if (!url) {
  console.error("❌ عيّن NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

let db: ReturnType<typeof createClient>;
let userIdFromAuth: string | null = null;

if (serviceKey) {
  db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else if (anonKey && password) {
  db = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else {
  console.error("❌ عيّن SUPABASE_SERVICE_ROLE_KEY أو SEED_USER_PASSWORD + ANON_KEY");
  process.exit(1);
}

async function findUserId(): Promise<string> {
  if (userIdFromAuth) return userIdFromAuth;
  if (serviceKey) {
    const { data, error } = await db.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error(`لم يُعثر على مستخدم بالبريد: ${email}`);
    return user.id;
  }
  if (!password) throw new Error("SEED_USER_PASSWORD مطلوب بدون service role");
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`تسجيل الدخول: ${error?.message ?? "فشل"}`);
  userIdFromAuth = data.user.id;
  return userIdFromAuth;
}

async function main() {
  const userId = await findUserId();
  console.log(`📚 بذر مكتبة القراءة للمستخدم ${email} (${userId})`);
  const result = await runMohamedBooksLibrarySeed(db, userId, { force });
  if (result.alreadySeeded) {
    console.log("✓ المكتبة مُبذرة مسبقاً — استخدم --force لإعادة المحاولة (لن يحذف الموجود)");
  } else {
    console.log(`✓ أُضيف ${result.inserted} كتاب · تُخطّى ${result.skipped} · الإجمالي ${result.total}`);
  }
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
