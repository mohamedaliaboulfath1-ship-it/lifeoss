import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";

const measurementSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  chest: z.number().optional(),
  waist: z.number().optional(),
  arm: z.number().optional(),
  thigh: z.number().optional(),
  note: z.string().optional(),
});

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { data, error } = await authResult.supabase
    .from("body_measurements")
    .select("*")
    .eq("user_id", authResult.userId)
    .order("measure_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const measurements = (data ?? []).map((m) => ({
    id: m.id,
    date: m.measure_date,
    chest: m.chest ?? undefined,
    waist: m.waist ?? undefined,
    arm: m.arm ?? undefined,
    thigh: m.thigh ?? undefined,
    note: m.notes ?? undefined,
  }));

  return NextResponse.json({ measurements });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = measurementSchema.parse(await req.json());
  const id = body.id ?? uid();

  const { error } = await authResult.supabase.from("body_measurements").upsert({
    id,
    user_id: authResult.userId,
    measure_date: body.date,
    chest: body.chest ?? null,
    waist: body.waist ?? null,
    arm: body.arm ?? null,
    thigh: body.thigh ?? null,
    notes: body.note ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  const { error } = await authResult.supabase
    .from("body_measurements")
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
