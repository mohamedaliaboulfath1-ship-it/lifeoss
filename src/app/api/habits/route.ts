import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getYearForUser } from "@/lib/year-data";
import { uid } from "@/lib/utils";
import type { Habit } from "@/types/lifeos";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { data } = await getYearForUser(authResult.userId);
  return NextResponse.json({
    habits: data.habits,
    habitLogs: data.habitLogs,
  });
}

const habitSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  cat: z.string(),
  freq: z.string(),
  time: z.string().optional(),
  dur: z.number().optional(),
  goalLink: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = habitSchema.parse(await req.json());
  const { year } = await getYearForUser(authResult.userId);
  const id = body.id ?? uid();

  const { error } = await authResult.supabase.from("habits").upsert({
    id,
    user_id: authResult.userId,
    year,
    name: body.name,
    cat: body.cat,
    freq: body.freq,
    time: body.time || null,
    dur: body.dur ?? null,
    goal_link: body.goalLink || null,
    note: body.note || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const habit: Habit = {
    id,
    name: body.name,
    cat: body.cat,
    freq: body.freq,
    time: body.time,
    dur: body.dur,
    goalLink: body.goalLink,
    note: body.note,
  };

  return NextResponse.json({ habit });
}

const toggleSchema = z.object({
  habitId: z.string(),
  date: z.string(),
});

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = toggleSchema.parse(await req.json());

  const { data: existing } = await authResult.supabase
    .from("habit_logs")
    .select("done")
    .eq("habit_id", body.habitId)
    .eq("log_date", body.date)
    .maybeSingle();

  const nextDone = existing ? !existing.done : true;

  if (existing) {
    await authResult.supabase
      .from("habit_logs")
      .update({ done: nextDone })
      .eq("habit_id", body.habitId)
      .eq("log_date", body.date);
  } else {
    await authResult.supabase.from("habit_logs").insert({
      habit_id: body.habitId,
      user_id: authResult.userId,
      log_date: body.date,
      done: nextDone,
    });
  }

  return NextResponse.json({ done: nextDone });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  await authResult.supabase
    .from("habit_logs")
    .delete()
    .eq("habit_id", id)
    .eq("user_id", authResult.userId);

  const { error } = await authResult.supabase
    .from("habits")
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
