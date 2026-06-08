import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";
import { mapTimeBlock, blockToRow } from "@/lib/time/blocks";
import { loadTimeSettings } from "@/lib/time/settings";
import { isWorkBlocked } from "@/lib/time/settings";

const blockSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  startAt: z.string(),
  endAt: z.string(),
  blockType: z.enum(["task", "habit", "deep_work", "personal", "meeting", "break"]).optional(),
  status: z.enum(["planned", "in_progress", "done", "missed", "rescheduled"]).optional(),
  domainId: z.string().optional(),
  goalId: z.string().optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  habitId: z.string().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  actualMinutes: z.number().int().min(0).optional(),
  isRecurring: z.boolean().optional(),
  recurringRule: z.record(z.unknown()).optional(),
  allowDuringWork: z.boolean().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
});

const patchSchema = blockSchema.partial().extend({ id: z.string() });

export async function GET(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const start = url.searchParams.get("start") ?? new Date().toISOString().slice(0, 10);
  const end = url.searchParams.get("end") ?? start;

  const { data, error } = await auth.supabase
    .from("time_blocks")
    .select("*")
    .eq("user_id", auth.userId)
    .gte("start_at", start)
    .lte("start_at", end + "T23:59:59")
    .order("start_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blocks: (data ?? []).map(mapTimeBlock) });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const body = blockSchema.parse(await req.json());
  const settings = await loadTimeSettings(auth.supabase, auth.userId);

  const start = new Date(body.startAt);
  const end = new Date(body.endAt);
  if (isWorkBlocked(settings, start, end, body.allowDuringWork ?? false)) {
    return NextResponse.json(
      { error: "هذا الوقت ضمن ساعات العمل — فعّل «السماح أثناء العمل» أو اختر وقتاً آخر" },
      { status: 400 }
    );
  }

  const id = body.id ?? uid();
  const row = blockToRow(auth.userId, { ...body, id });
  const { error } = await auth.supabase.from("time_blocks").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id, block: mapTimeBlock(row as unknown as Record<string, unknown>) });
}

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const body = patchSchema.parse(await req.json());
  const settings = await loadTimeSettings(auth.supabase, auth.userId);

  if (body.startAt && body.endAt) {
    const start = new Date(body.startAt);
    const end = new Date(body.endAt);
    if (isWorkBlocked(settings, start, end, body.allowDuringWork ?? false)) {
      return NextResponse.json({ error: "وقت محجوب بساعات العمل" }, { status: 400 });
    }
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title) patch.title = body.title;
  if (body.startAt) patch.start_at = body.startAt;
  if (body.endAt) patch.end_at = body.endAt;
  if (body.blockType) patch.block_type = body.blockType;
  if (body.status) patch.status = body.status;
  if (body.domainId !== undefined) patch.domain_id = body.domainId || null;
  if (body.goalId !== undefined) patch.goal_id = body.goalId || null;
  if (body.taskId !== undefined) patch.task_id = body.taskId || null;
  if (body.habitId !== undefined) patch.habit_id = body.habitId || null;
  if (body.estimatedMinutes !== undefined) patch.estimated_minutes = body.estimatedMinutes;
  if (body.actualMinutes !== undefined) patch.actual_minutes = body.actualMinutes;
  if (body.allowDuringWork !== undefined) patch.allow_during_work = body.allowDuringWork;
  if (body.color !== undefined) patch.color = body.color;
  if (body.notes !== undefined) patch.notes = body.notes;

  const { error } = await auth.supabase.from("time_blocks").update(patch).eq("id", body.id).eq("user_id", auth.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });
  const { error } = await auth.supabase.from("time_blocks").delete().eq("id", id).eq("user_id", auth.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
