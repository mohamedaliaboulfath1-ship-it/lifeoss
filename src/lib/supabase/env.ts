export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;
  if (url.includes("YOUR_PROJECT") || anonKey === "your-anon-key") return null;

  return { url, anonKey };
}

export function assertSupabaseEnv() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see .env.local.example)."
    );
  }
  return env;
}

export function isSupabaseConfigured() {
  return getSupabaseEnv() !== null;
}
