import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";

const profileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  timezone: z.string().max(64).optional(),
  language: z.enum(["ar", "en"]).optional(),
  bio: z.string().max(500).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
});

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { data: profile, error: profileError } = await authResult.supabase
    .from("profiles")
    .select("display_name, avatar_url, timezone, language, bio, city, current_year, created_at, updated_at")
    .eq("id", authResult.userId)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { data: authUser } = await authResult.supabase.auth.getUser();

  return NextResponse.json({
    profile: {
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      timezone: profile.timezone ?? "Asia/Riyadh",
      language: profile.language ?? "ar",
      bio: profile.bio,
      city: profile.city,
      currentYear: profile.current_year,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    },
    email: authUser.user?.email ?? null,
    lastSignIn: authUser.user?.last_sign_in_at ?? null,
  });
}

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = profileSchema.parse(await req.json());
  const updates: Record<string, unknown> = {};

  if (body.displayName !== undefined) updates.display_name = body.displayName;
  if (body.avatarUrl !== undefined) updates.avatar_url = body.avatarUrl;
  if (body.timezone !== undefined) updates.timezone = body.timezone;
  if (body.language !== undefined) updates.language = body.language;
  if (body.bio !== undefined) updates.bio = body.bio;
  if (body.city !== undefined) updates.city = body.city;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "لا توجد حقول للتحديث" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await authResult.supabase
    .from("profiles")
    .update(updates)
    .eq("id", authResult.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return GET();
}
