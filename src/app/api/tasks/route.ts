import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";
import { recalculateGoalProgressFromTasks } from "@/lib/goals/auto-progress";
import { invalidateUserContext } from "@/lib/year-data";

function mapTaskRow(t: Record<string, unknown>) {
  return {
    id: t.id as string,
    title: t.title as string,
    status: t.status as "inbox" | "active" | "done" | "archive",
    priority: (t.priority as "p1" | "p2" | "p3" | "p4") ?? "p3",
    dueDate: (t.due_date as string | null) ?? undefined,
    estimatedTime: (t.estimated_time as number | null) ?? undefined,
    goalId: (t.goal_id as string | null) ?? undefined,
    completedDate: (t.completed_date as string | null) ?? undefined,
    note: (t.notes as string | null) ?? undefined,
  };
}

const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  status: z.enum(["inbox", "active", "done", "archive"]).default("inbox"),
  priority: z.enum(["p1", "p2", "p3", "p4"]).default("p3"),
  dueDate: z.string().optional(),
  estimatedTime: z.number().int().min(0).optional(),
  goalId: z.string().optional(),
  note: z.string().optional(),
});

const patchSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  status: z.enum(["inbox", "active", "done", "archive"]).optional(),
  priority: z.enum(["p1", "p2", "p3", "p4"]).optional(),
  dueDate: z.string().optional(),
  estimatedTime: z.number().int().min(0).optional(),
  goalId: z.string().nullable().optional(),
  note: z.string().optional(),
});

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const goalId = url.searchParams.get("goalId");

  let query = authResult.supabase
    .from("life_tasks")
    .select("*")
    .eq("user_id", authResult.userId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (goalId) query = query.eq("goal_id", goalId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tasks = (data ?? []).map((t) => mapTaskRow(t as Record<string, unknown>));

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = taskSchema.parse(await req.json());
  const id = body.id ?? uid();
  const completedDate = body.status === "done" ? new Date().toISOString().slice(0, 10) : null;

  const { error } = await authResult.supabase.from("life_tasks").insert({
    id,
    user_id: authResult.userId,
    title: body.title,
    status: body.status,
    priority: body.priority,
    due_date: body.dueDate || null,
    estimated_time: body.estimatedTime ?? null,
    goal_id: body.goalId || null,
    completed_date: completedDate,
    notes: body.note || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (body.goalId) {
    await recalculateGoalProgressFromTasks(authResult.supabase, authResult.userId, body.goalId);
  }

  invalidateUserContext(authResult.userId);

  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = patchSchema.parse(await req.json());
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) updates.title = body.title;
  if (body.status !== undefined) {
    updates.status = body.status;
    updates.completed_date = body.status === "done" ? new Date().toISOString().slice(0, 10) : null;
  }
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.dueDate !== undefined) updates.due_date = body.dueDate || null;
  if (body.estimatedTime !== undefined) updates.estimated_time = body.estimatedTime;
  if (body.goalId !== undefined) updates.goal_id = body.goalId || null;
  if (body.note !== undefined) updates.notes = body.note || null;

  const { data: before } = await authResult.supabase
    .from("life_tasks")
    .select("goal_id")
    .eq("id", body.id)
    .eq("user_id", authResult.userId)
    .maybeSingle();

  const { error } = await authResult.supabase
    .from("life_tasks")
    .update(updates)
    .eq("id", body.id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: updated, error: readErr } = await authResult.supabase
    .from("life_tasks")
    .select("*")
    .eq("id", body.id)
    .eq("user_id", authResult.userId)
    .maybeSingle();

  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  const touchedGoalIds = new Set<string>();
  if (before?.goal_id) touchedGoalIds.add(before.goal_id as string);
  if (body.goalId) touchedGoalIds.add(body.goalId);
  for (const goalId of touchedGoalIds) {
    await recalculateGoalProgressFromTasks(authResult.supabase, authResult.userId, goalId);
  }

  invalidateUserContext(authResult.userId);

  return NextResponse.json({
    ok: true,
    task: updated ? mapTaskRow(updated as Record<string, unknown>) : null,
  });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  const { data: before } = await authResult.supabase
    .from("life_tasks")
    .select("goal_id")
    .eq("id", id)
    .eq("user_id", authResult.userId)
    .maybeSingle();

  const { error } = await authResult.supabase
    .from("life_tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (before?.goal_id) {
    await recalculateGoalProgressFromTasks(
      authResult.supabase,
      authResult.userId,
      before.goal_id as string
    );
  }

  invalidateUserContext(authResult.userId);

  return NextResponse.json({ ok: true });
}

