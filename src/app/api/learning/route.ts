import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid, today } from "@/lib/utils";

const sessionSchema = z.object({
  topic: z.string().min(1),
  date: z.string().optional(),
  durationMin: z.number().int().optional(),
  focus: z.number().int().min(1).max(10).optional(),
});

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = sessionSchema.parse(await req.json());
  const id = uid();

  const { error } = await authResult.supabase.from("study_sessions").insert({
    id,
    user_id: authResult.userId,
    topic: body.topic,
    session_date: body.date ?? today(),
    duration_min: body.durationMin ?? 45,
    focus_score: body.focus ?? 8,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}
