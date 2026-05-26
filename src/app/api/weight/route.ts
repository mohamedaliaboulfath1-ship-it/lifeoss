import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";

const weightSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  weight: z.number().positive(),
  sleep: z.number().optional(),
  cals: z.number().optional(),
  note: z.string().optional(),
});

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { data, error } = await authResult.supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", authResult.userId)
    .order("log_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const logs = (data ?? []).map((w) => ({
    id: w.id,
    date: w.log_date,
    weight: w.weight,
    sleep: w.sleep ?? undefined,
    cals: w.cals ?? undefined,
    note: w.note ?? undefined,
  }));

  return NextResponse.json({ logs });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = weightSchema.parse(await req.json());
  const id = body.id ?? uid();

  const { error } = await authResult.supabase.from("weight_logs").upsert({
    id,
    user_id: authResult.userId,
    log_date: body.date,
    weight: body.weight,
    sleep: body.sleep ?? null,
    cals: body.cals ?? null,
    note: body.note || null,
  });

  if (error) {
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
    .from("weight_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
