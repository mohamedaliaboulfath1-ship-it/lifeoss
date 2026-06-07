import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { seedDailyNotifications } from "@/lib/notifications/seed";

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  try {
    await seedDailyNotifications(authResult.supabase, authResult.userId);
  } catch {
    /* non-blocking */
  }

  const unreadOnly = new URL(req.url).searchParams.get("unread") === "1";

  let query = authResult.supabase
    .from("notifications")
    .select("*")
    .eq("user_id", authResult.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const unreadCount = (data ?? []).filter((n) => !n.read_at).length;

  return NextResponse.json({
    notifications: (data ?? []).map((n) => ({
      id: n.id,
      type: n.type,
      priority: n.priority,
      title: n.title,
      body: n.body,
      actionUrl: n.action_url,
      readAt: n.read_at,
      createdAt: n.created_at,
    })),
    unreadCount,
  });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  read: z.boolean().optional(),
  dismissed: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = patchSchema.parse(await req.json());
  const updates: Record<string, unknown> = {};
  if (body.read) updates.read_at = new Date().toISOString();
  if (body.dismissed) updates.dismissed_at = new Date().toISOString();

  const { error } = await authResult.supabase
    .from("notifications")
    .update(updates)
    .eq("id", body.id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = z
    .object({
      type: z.enum(["alert", "insight", "reminder", "deadline", "achievement", "system"]),
      title: z.string().min(1),
      body: z.string().optional(),
      actionUrl: z.string().optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    })
    .parse(await req.json());

  const { data, error } = await authResult.supabase
    .from("notifications")
    .insert({
      user_id: authResult.userId,
      type: body.type,
      title: body.title,
      body: body.body ?? null,
      action_url: body.actionUrl ?? null,
      priority: body.priority ?? "normal",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
