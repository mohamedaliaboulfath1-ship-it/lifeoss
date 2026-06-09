import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { enrichHabit } from "@/lib/habits/intelligence";
import { activeDaysFromSchedule } from "@/lib/habits/schedule";
import { resolveDomainId } from "@/lib/domains";
import { getYearForUser } from "@/lib/year-data";
import { uid } from "@/lib/utils";
import type { Goal, Habit } from "@/types/lifeos";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { data } = await getYearForUser(authResult.userId);
  const goalsById = new Map((data.goals ?? []).map((g) => [g.id, g]));
  const enriched = (data.habits ?? []).map((h) =>
    enrichHabit(h, data.habitLogs ?? {}, goalsById)
  );

  return NextResponse.json({
    habits: data.habits,
    habitLogs: data.habitLogs,
    enriched,
  });
}

const habitSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  cat: z.string().optional(),
  freq: z.string().optional(),
  time: z.string().optional(),
  dur: z.number().optional(),
  goalLink: z.string().optional(),
  projectId: z.string().optional(),
  note: z.string().optional(),
  domainId: z.string().optional(),
  why: z.string().optional(),
  stopImpact: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  impact: z.enum(["low", "medium", "high"]).optional(),
  activeDays: z.array(z.number().min(0).max(6)).optional(),
  frequencyType: z.enum(["daily", "weekly", "monthly", "interval", "custom"]).optional(),
  frequencyValue: z.record(z.unknown()).optional(),
  lifeScoreWeight: z.number().optional(),
});

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = habitSchema.parse(await req.json());
  const { year } = await getYearForUser(authResult.userId);
  const id = body.id ?? uid();
  const cat = body.cat ?? "health";
  const goalId = body.goalLink || null;
  const frequencyType = body.frequencyType ?? "daily";
  const frequencyValue = body.frequencyValue ?? {};
  const activeDays = body.activeDays ?? activeDaysFromSchedule({ frequencyType, frequencyValue, activeDays: body.activeDays });

  const { error } = await authResult.supabase.from("habits").upsert({
    id,
    user_id: authResult.userId,
    year,
    name: body.name,
    cat,
    category: cat,
    freq: body.freq ?? "daily",
    frequency: body.freq ?? "daily",
    active: true,
    time: body.time || null,
    time_of_day: body.time || null,
    dur: body.dur ?? null,
    goal_link: goalId,
    goal_id: goalId,
    project_id: body.projectId ?? null,
    domain_id: body.domainId ?? resolveDomainId(cat),
    note: body.note || null,
    why: body.why ?? null,
    stop_impact: body.stopImpact ?? null,
    priority: body.priority ?? "normal",
    impact: body.impact ?? "medium",
    active_days: activeDays,
    frequency_type: frequencyType,
    frequency_value: frequencyValue,
    life_score_weight: body.lifeScoreWeight ?? 1,
  });

  if (error) {
    const missing = error.message.includes("does not exist");
    return NextResponse.json(
      { error: error.message, migrationRequired: missing },
      { status: missing ? 400 : 500 }
    );
  }

  if (goalId) {
    await authResult.supabase.from("goal_habit_links").insert({
      id: uid(),
      user_id: authResult.userId,
      goal_id: goalId,
      habit_id: id,
      weight: 1,
    });
  }

  const habit: Habit = {
    id,
    name: body.name,
    cat,
    freq: body.freq ?? "daily",
    time: body.time,
    dur: body.dur,
    goalLink: body.goalLink,
    projectId: body.projectId,
    note: body.note,
    domainId: body.domainId,
    why: body.why,
    stopImpact: body.stopImpact,
    priority: body.priority,
    impact: body.impact,
    activeDays,
    frequencyType,
    frequencyValue,
    lifeScoreWeight: body.lifeScoreWeight,
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

  const raw = await req.json();
  if (raw.habitId && raw.date) {
    const body = toggleSchema.parse(raw);
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

  const body = habitSchema.extend({ id: z.string() }).parse(raw);
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.cat !== undefined) { updates.cat = body.cat; updates.category = body.cat; }
  if (body.freq !== undefined) { updates.freq = body.freq; updates.frequency = body.freq; }
  if (body.time !== undefined) updates.time = body.time ?? null;
  if (body.goalLink !== undefined) { updates.goal_id = body.goalLink ?? null; updates.goal_link = body.goalLink ?? null; }
  if (body.projectId !== undefined) updates.project_id = body.projectId ?? null;
  if (body.domainId !== undefined) updates.domain_id = body.domainId;
  if (body.note !== undefined) updates.note = body.note ?? null;
  if (body.why !== undefined) updates.why = body.why ?? null;
  if (body.stopImpact !== undefined) updates.stop_impact = body.stopImpact ?? null;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.impact !== undefined) updates.impact = body.impact;
  if (body.lifeScoreWeight !== undefined) updates.life_score_weight = body.lifeScoreWeight;
  if (body.frequencyType !== undefined) {
    updates.frequency_type = body.frequencyType;
    updates.frequency_value = body.frequencyValue ?? {};
    updates.active_days = activeDaysFromSchedule(body);
  } else if (body.activeDays !== undefined) {
    updates.active_days = body.activeDays;
  }

  const { error } = await authResult.supabase
    .from("habits")
    .update(updates)
    .eq("id", body.id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  await authResult.supabase.from("goal_habit_links").delete().eq("habit_id", id);
  await authResult.supabase.from("habit_logs").delete().eq("habit_id", id).eq("user_id", authResult.userId);

  const { error } = await authResult.supabase
    .from("habits")
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
