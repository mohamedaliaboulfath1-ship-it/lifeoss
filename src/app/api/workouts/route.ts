import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";

const exerciseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  muscleGroup: z.string().optional(),
  equipment: z.string().optional(),
});

const logSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  exerciseId: z.string().optional(),
  weight: z.number().optional(),
  reps: z.number().int().optional(),
  sets: z.number().int().optional(),
  rpe: z.number().optional(),
  notes: z.string().optional(),
});

const patchSchema = z.object({
  entity: z.enum(["exercise", "log"]),
  payload: z.record(z.string(), z.unknown()),
});

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const type = new URL(req.url).searchParams.get("type") ?? "all";

  if (type === "exercises" || type === "all") {
    const [exRes, logRes] = await Promise.all([
      authResult.supabase.from("exercises").select("*").eq("user_id", authResult.userId),
      type === "all"
        ? authResult.supabase
            .from("workout_set_logs")
            .select("*")
            .eq("user_id", authResult.userId)
            .order("log_date", { ascending: false })
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (exRes.error) return NextResponse.json({ error: exRes.error.message }, { status: 500 });

    const exercises = (exRes.data ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      muscleGroup: e.muscle_group ?? undefined,
      equipment: e.equipment ?? undefined,
    }));

    if (type === "exercises") return NextResponse.json({ exercises });

    if (logRes.error) return NextResponse.json({ error: logRes.error.message }, { status: 500 });

    const workoutLogs = (logRes.data ?? []).map((w) => ({
      id: w.id,
      date: w.log_date,
      exerciseId: w.exercise_id ?? undefined,
      weight: w.weight ?? undefined,
      reps: w.reps ?? undefined,
      sets: w.sets ?? undefined,
      rpe: w.rpe ?? undefined,
      notes: w.notes ?? undefined,
    }));

    return NextResponse.json({ exercises, workoutLogs });
  }

  const { data, error } = await authResult.supabase
    .from("workout_set_logs")
    .select("*")
    .eq("user_id", authResult.userId)
    .order("log_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    workoutLogs: (data ?? []).map((w) => ({
      id: w.id,
      date: w.log_date,
      exerciseId: w.exercise_id ?? undefined,
      weight: w.weight ?? undefined,
      reps: w.reps ?? undefined,
      sets: w.sets ?? undefined,
      rpe: w.rpe ?? undefined,
      notes: w.notes ?? undefined,
    })),
  });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const entity = body.entity as string;

  if (entity === "exercise") {
    const parsed = exerciseSchema.parse(body.payload);
    const id = parsed.id ?? uid();
    const { error } = await authResult.supabase.from("exercises").upsert({
      id,
      user_id: authResult.userId,
      name: parsed.name,
      muscle_group: parsed.muscleGroup ?? null,
      equipment: parsed.equipment ?? null,
      is_custom: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  const parsed = logSchema.parse(body.payload);
  const id = parsed.id ?? uid();
  const { error } = await authResult.supabase.from("workout_set_logs").insert({
    id,
    user_id: authResult.userId,
    log_date: parsed.date,
    exercise_id: parsed.exerciseId ?? null,
    weight: parsed.weight ?? null,
    reps: parsed.reps ?? null,
    sets: parsed.sets ?? null,
    rpe: parsed.rpe ?? null,
    notes: parsed.notes ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const url = new URL(req.url);
  const entity = url.searchParams.get("entity");
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  const table = entity === "exercise" ? "exercises" : "workout_set_logs";
  const { error } = await authResult.supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
