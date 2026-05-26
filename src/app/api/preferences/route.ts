import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { data, error } = await authResult.supabase
    .from("user_preferences")
    .select("theme, notifications, settings")
    .eq("user_id", authResult.userId)
    .maybeSingle();

  if (error) {
    if (error.message.includes("user_preferences") || error.code === "42P01") {
      return NextResponse.json({ theme: "dark", notifications: {}, settings: {} });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    data ?? { theme: "dark", notifications: {}, settings: {} }
  );
}

const patchSchema = z.object({
  theme: z.enum(["dark", "light", "system"]).optional(),
  notifications: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
});

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = patchSchema.parse(await req.json());

  const { data: existing } = await authResult.supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", authResult.userId)
    .maybeSingle();

  const row = {
    user_id: authResult.userId,
    theme: body.theme ?? existing?.theme ?? "dark",
    notifications: body.notifications ?? existing?.notifications ?? {},
    settings: body.settings ?? existing?.settings ?? {},
  };

  const { error } = await authResult.supabase
    .from("user_preferences")
    .upsert(row, { onConflict: "user_id" });

  if (error) {
    if (error.message.includes("user_preferences") || error.code === "42P01") {
      return NextResponse.json({ ok: true, theme: body.theme ?? "dark" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, theme: row.theme });
}
