import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/tenant/super-admin";

export async function requireSession() {
  if (!isSupabaseConfigured()) {
    return {
      error: NextResponse.json(
        {
          error:
            "Supabase غير مُعدّ — أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في .env.local",
        },
        { status: 503 }
      ),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: NextResponse.json({ error: "غير مصرح" }, { status: 401 }) };
  }

  // Fire-and-forget activity ping (non-blocking)
  void supabase
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", user.id);

  return { user, userId: user.id, supabase };
}

export async function requireAdmin() {
  const session = await requireSession();
  if ("error" in session) return session;

  const { data: profile } = await session.supabase
    .from("profiles")
    .select("role, suspended")
    .eq("id", session.userId)
    .single();

  if (profile?.suspended) {
    return {
      error: NextResponse.json({ error: "الحساب معلّق" }, { status: 403 }),
    };
  }

  if (!isAdminRole(profile?.role)) {
    return {
      error: NextResponse.json({ error: "صلاحيات المسؤول مطلوبة" }, { status: 403 }),
    };
  }

  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if ("error" in session) return session;

  const { data: profile } = await session.supabase
    .from("profiles")
    .select("role, suspended")
    .eq("id", session.userId)
    .single();

  if (profile?.suspended) {
    return {
      error: NextResponse.json({ error: "الحساب معلّق" }, { status: 403 }),
    };
  }

  if (profile?.role !== "super_admin") {
    return {
      error: NextResponse.json(
        { error: "حساب المسؤول الأعلى مطلوب" },
        { status: 403 }
      ),
    };
  }

  return session;
}

export async function logActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  action: string,
  meta?: { entityType?: string; entityId?: string; metadata?: Record<string, unknown> }
) {
  await supabase.from("activity_log").insert({
    user_id: userId,
    action,
    entity_type: meta?.entityType ?? null,
    entity_id: meta?.entityId ?? null,
    metadata: meta?.metadata ?? {},
  });
}
