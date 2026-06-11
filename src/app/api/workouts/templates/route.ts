import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";

const scheduleDaySchema = z.object({
  day: z.string(),
  label: z.string(),
  exercises: z.array(z.string()).optional(),
  focus: z.string().optional(),
});

const templateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  splitType: z.enum(["ppl", "upper_lower", "full_body", "custom"]).default("custom"),
  daysPerWeek: z.number().int().min(1).max(7).default(4),
  schedule: z.array(scheduleDaySchema).default([]),
  notes: z.string().optional(),
});

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { data, error } = await authResult.supabase
    .from("workout_templates")
    .select("*")
    .eq("user_id", authResult.userId)
    .order("updated_at", { ascending: false });

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json({ templates: [], migrationRequired: "015" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    templates: (data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      splitType: t.split_type,
      daysPerWeek: t.days_per_week,
      schedule: t.schedule ?? [],
      notes: t.notes ?? undefined,
      updatedAt: t.updated_at,
    })),
  });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const parsed = templateSchema.parse(await req.json());
  const id = parsed.id ?? uid();
  const now = new Date().toISOString();

  const { error } = await authResult.supabase.from("workout_templates").upsert({
    id,
    user_id: authResult.userId,
    name: parsed.name,
    split_type: parsed.splitType,
    days_per_week: parsed.daysPerWeek,
    schedule: parsed.schedule,
    notes: parsed.notes ?? null,
    updated_at: now,
  });

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json({ error: "شغّل migration 015 أولاً", migrationRequired: "015" }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  const { error } = await authResult.supabase
    .from("workout_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
