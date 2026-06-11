import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid, today } from "@/lib/utils";

const entityEnum = z.enum(["path", "knowledge_area", "session"]);

const sessionSchema = z.object({
  topic: z.string().min(1),
  date: z.string().optional(),
  durationMin: z.number().int().optional(),
  focus: z.number().int().min(1).max(10).optional(),
});

const pathSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  progress: z.number().int().min(0).max(100).optional(),
  targetDate: z.string().optional(),
});

const areaSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  progress: z.number().int().min(0).optional(),
  target: z.number().int().min(1).optional(),
});

const postSchema = z.object({
  entity: entityEnum,
  payload: z.record(z.string(), z.unknown()),
});

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const [pathsRes, areasRes, sessionsRes] = await Promise.all([
    authResult.supabase
      .from("learning_paths")
      .select("*")
      .eq("user_id", authResult.userId)
      .order("created_at", { ascending: false }),
    authResult.supabase
      .from("knowledge_areas")
      .select("*")
      .eq("user_id", authResult.userId)
      .order("created_at", { ascending: false }),
    authResult.supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", authResult.userId)
      .order("session_date", { ascending: false })
      .limit(50),
  ]);

  if (pathsRes.error || areasRes.error || sessionsRes.error) {
    return NextResponse.json(
      { error: pathsRes.error?.message ?? areasRes.error?.message ?? sessionsRes.error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    paths: (pathsRes.data ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      progress: p.progress,
      targetDate: p.target_date ?? undefined,
    })),
    knowledgeAreas: (areasRes.data ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      progress: a.progress,
      target: a.target,
    })),
    sessions: (sessionsRes.data ?? []).map((s) => ({
      id: s.id,
      topic: s.topic,
      date: s.session_date,
      durationMin: s.duration_min,
      focus: s.focus_score ?? 5,
    })),
  });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();

  if (!body.entity) {
    const parsed = sessionSchema.parse(body);
    const id = uid();
    const { error } = await authResult.supabase.from("study_sessions").insert({
      id,
      user_id: authResult.userId,
      topic: parsed.topic,
      session_date: parsed.date ?? today(),
      duration_min: parsed.durationMin ?? 45,
      focus_score: parsed.focus ?? 8,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  const { entity, payload } = postSchema.parse(body);

  if (entity === "session") {
    const parsed = sessionSchema.parse(payload);
    const id = uid();
    const { error } = await authResult.supabase.from("study_sessions").insert({
      id,
      user_id: authResult.userId,
      topic: parsed.topic,
      session_date: parsed.date ?? today(),
      duration_min: parsed.durationMin ?? 45,
      focus_score: parsed.focus ?? 8,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "path") {
    const parsed = pathSchema.parse(payload);
    const id = parsed.id ?? uid();
    const { error } = await authResult.supabase.from("learning_paths").upsert({
      id,
      user_id: authResult.userId,
      title: parsed.title,
      progress: parsed.progress ?? 0,
      target_date: parsed.targetDate ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  const parsed = areaSchema.parse(payload);
  const id = parsed.id ?? uid();
  const { error } = await authResult.supabase.from("knowledge_areas").upsert({
    id,
    user_id: authResult.userId,
    name: parsed.name,
    progress: parsed.progress ?? 0,
    target: parsed.target ?? 100,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}

const patchSchema = z.object({
  entity: entityEnum,
  id: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = patchSchema.parse(await req.json());
  const now = new Date().toISOString();

  if (body.entity === "path") {
    const parsed = pathSchema.parse(body.payload);
    const { error } = await authResult.supabase
      .from("learning_paths")
      .update({
        title: parsed.title,
        progress: parsed.progress,
        target_date: parsed.targetDate ?? null,
        updated_at: now,
      })
      .eq("id", body.id)
      .eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const parsed = areaSchema.parse(body.payload);
  const { error } = await authResult.supabase
    .from("knowledge_areas")
    .update({
      name: parsed.name,
      progress: parsed.progress,
      target: parsed.target,
      updated_at: now,
    })
    .eq("id", body.id)
    .eq("user_id", authResult.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const url = new URL(req.url);
  const entity = url.searchParams.get("entity");
  const id = url.searchParams.get("id");
  if (!id || !entity) return NextResponse.json({ error: "entity و id مطلوبان" }, { status: 400 });

  const table =
    entity === "path" ? "learning_paths" :
    entity === "knowledge_area" ? "knowledge_areas" :
    "study_sessions";

  const { error } = await authResult.supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
