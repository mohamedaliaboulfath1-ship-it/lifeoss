/**
 * Browser Supabase client — use in Client Components only.
 * For Server Components / Route Handlers use `@/lib/supabase/server`.
 */
import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  const { url, anonKey } = assertSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
