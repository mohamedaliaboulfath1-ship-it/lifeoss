import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, logActivity } from "@/lib/api-auth";

export async function GET(req: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const action = new URL(req.url).searchParams.get("action") ?? "stats";

  if (action === "stats") {
    const [usersRes, activeRes, booksRes, notifRes] = await Promise.all([
      authResult.supabase.from("profiles").select("id", { count: "exact", head: true }),
      authResult.supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_active_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      authResult.supabase.from("books").select("id", { count: "exact", head: true }),
      authResult.supabase.from("notifications").select("id", { count: "exact", head: true }),
    ]);

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count: newUsers } = await authResult.supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo);

    return NextResponse.json({
      totalUsers: usersRes.count ?? 0,
      activeUsers7d: activeRes.count ?? 0,
      newRegistrations7d: newUsers ?? 0,
      totalBooks: booksRes.count ?? 0,
      totalNotifications: notifRes.count ?? 0,
      systemHealth: "operational",
    });
  }

  if (action === "users") {
    const q = new URL(req.url).searchParams.get("q")?.trim();
    let query = authResult.supabase
      .from("profiles")
      .select("id, display_name, role, suspended, created_at, last_active_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (q) query = query.ilike("display_name", `%${q}%`);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users: data });
  }

  if (action === "activity") {
    const { data, error } = await authResult.supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ logs: data });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}

const patchSchema = z.object({
  userId: z.string().uuid(),
  suspended: z.boolean().optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export async function PATCH(req: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const body = patchSchema.parse(await req.json());
  const updates: Record<string, unknown> = {};
  if (body.suspended !== undefined) updates.suspended = body.suspended;
  if (body.role !== undefined) updates.role = body.role;

  const { error } = await authResult.supabase
    .from("profiles")
    .update(updates)
    .eq("id", body.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logActivity(authResult.supabase, authResult.userId, "admin_user_update", {
    entityType: "profile",
    entityId: body.userId,
    metadata: updates,
  });

  return NextResponse.json({ ok: true });
}
