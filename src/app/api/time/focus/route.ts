import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";

const schema = z.object({
  id: z.string().optional(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  sessionType: z.enum(["pomodoro_25", "pomodoro_50", "deep_90", "deep_120", "deep_work", "custom"]),
  domainId: z.string().optional(),
  goalId: z.string().optional(),
  taskId: z.string().optional(),
  timeBlockId: z.string().optional(),
  interrupted: z.boolean().optional(),
  focusScore: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const start = new URL(req.url).searchParams.get("start");
  let q = auth.supabase.from("focus_sessions").select("*").eq("user_id", auth.userId).order("started_at", { ascending: false }).limit(50);
  if (start) q = q.gte("started_at", start);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    sessions: (data ?? []).map((s) => ({
      id: s.id,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      durationMinutes: s.duration_minutes,
      sessionType: s.session_type,
      domainId: s.domain_id,
      goalId: s.goal_id,
      taskId: s.task_id,
      interrupted: s.interrupted,
      focusScore: s.focus_score,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const body = schema.parse(await req.json());
  const id = body.id ?? uid();
  const { error } = await auth.supabase.from("focus_sessions").insert({
    id,
    user_id: auth.userId,
    started_at: body.startedAt,
    ended_at: body.endedAt ?? null,
    duration_minutes: body.durationMinutes,
    session_type: body.sessionType,
    domain_id: body.domainId ?? null,
    goal_id: body.goalId ?? null,
    task_id: body.taskId ?? null,
    time_block_id: body.timeBlockId ?? null,
    interrupted: body.interrupted ?? false,
    focus_score: body.focusScore ?? null,
    notes: body.notes ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.timeBlockId) {
    await auth.supabase
      .from("time_blocks")
      .update({ status: "done", actual_minutes: body.durationMinutes, updated_at: new Date().toISOString() })
      .eq("id", body.timeBlockId)
      .eq("user_id", auth.userId);
  }

  return NextResponse.json({ ok: true, id });
}
