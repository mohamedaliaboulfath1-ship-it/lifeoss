import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getYearForUser } from "@/lib/year-data";
import { uid } from "@/lib/utils";
import type { Goal } from "@/types/lifeos";

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const year = new URL(req.url).searchParams.get("year");
  const { data } = await getYearForUser(authResult.userId, year);
  return NextResponse.json({ goals: data.goals });
}

const goalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  area: z.string(),
  category: z.string().optional(),
  domainId: z.string().optional(),
  priority: z.enum(["high", "med", "low"]).default("high"),
  level: z.enum(["vision", "goal", "project"]).optional(),
  parentId: z.string().optional(),
  status: z.enum(["active", "done", "paused", "cancelled"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
  why: z.string().optional(),
  successCriteria: z.string().optional(),
  start: z.string().optional(),
  due: z.string().optional(),
  current: z.string().optional(),
  target: z.string().optional(),
  unit: z.string().optional(),
  tasks: z
    .array(z.object({ id: z.string(), text: z.string(), done: z.boolean() }))
    .optional(),
  habits: z.string().optional(),
});

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = goalSchema.parse(await req.json());
  const { year } = await getYearForUser(authResult.userId, null);
  const id = body.id ?? uid();

  const progress = body.progress ?? (body.current ? parseInt(body.current, 10) : 0);
  const row = {
    id,
    user_id: authResult.userId,
    year,
    title: body.title,
    area: body.area,
    category: body.category ?? body.area,
    domain_id: body.domainId ?? null,
    level: body.level ?? "goal",
    parent_id: body.parentId ?? null,
    status: body.status ?? "active",
    progress,
    description: body.description ?? null,
    why: body.why ?? null,
    success_criteria: body.successCriteria ?? null,
    priority: body.priority,
    start_date: body.start || null,
    due_date: body.due || null,
    target_date: body.due || null,
    current_val: body.current ?? String(progress),
    target_val: body.target || null,
    unit: body.unit || null,
    done: body.status === "done",
    tasks: body.tasks ?? [],
    habits: body.habits || null,
    start_val: body.current ?? "0",
  };

  const { error } = await authResult.supabase.from("goals").upsert(row);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const goal: Goal = {
    id,
    title: body.title,
    area: body.area as Goal["area"],
    priority: body.priority,
    start: body.start,
    due: body.due,
    current: body.current,
    target: body.target,
    unit: body.unit,
    tasks: body.tasks ?? [],
    habits: body.habits,
  };

  return NextResponse.json({ goal });
}

const patchSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  area: z.string().optional(),
  priority: z.enum(["high", "med", "low"]).optional(),
  current: z.string().optional(),
  target: z.string().optional(),
  unit: z.string().optional(),
  done: z.boolean().optional(),
  status: z.enum(["active", "done", "paused", "cancelled"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  level: z.enum(["vision", "goal", "project"]).optional(),
  parentId: z.string().optional(),
  description: z.string().optional(),
  why: z.string().optional(),
  successCriteria: z.string().optional(),
  tasks: z
    .array(z.object({ id: z.string(), text: z.string(), done: z.boolean() }))
    .optional(),
  due: z.string().optional(),
});

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = patchSchema.parse(await req.json());
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) updates.title = body.title;
  if (body.area !== undefined) updates.area = body.area;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.current !== undefined) updates.current_val = body.current;
  if (body.target !== undefined) updates.target_val = body.target;
  if (body.unit !== undefined) updates.unit = body.unit;
  if (body.done !== undefined) updates.done = body.done;
  if (body.status !== undefined) {
    updates.status = body.status;
    updates.done = body.status === "done";
  }
  if (body.progress !== undefined) {
    updates.progress = body.progress;
    updates.current_val = String(body.progress);
  }
  if (body.level !== undefined) updates.level = body.level;
  if (body.parentId !== undefined) updates.parent_id = body.parentId || null;
  if (body.description !== undefined) updates.description = body.description;
  if (body.why !== undefined) updates.why = body.why;
  if (body.successCriteria !== undefined) updates.success_criteria = body.successCriteria;
  if (body.tasks !== undefined) updates.tasks = body.tasks;
  if (body.due !== undefined) {
    updates.due_date = body.due || null;
    updates.target_date = body.due || null;
  }

  const { error } = await authResult.supabase
    .from("goals")
    .update(updates)
    .eq("id", body.id)
    .eq("user_id", authResult.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  const { error } = await authResult.supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
