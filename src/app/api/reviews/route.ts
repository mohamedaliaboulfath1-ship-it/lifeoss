import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";

const periodSchema = z.enum(["daily", "weekly", "monthly", "quarterly", "annual"]);

const dailySchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  mood: z.number().min(1).max(5).optional(),
  energy: z.number().min(1).max(5).optional(),
  gratitudes: z.string().optional(),
  wins: z.string().optional(),
  lesson: z.string().optional(),
  tomorrowPlan: z.string().optional(),
  note: z.string().optional(),
});

const reviewSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  period: periodSchema.exclude(["daily"]),
  wins: z.string().optional(),
  challenges: z.string().optional(),
  lessons: z.string().optional(),
  nextFocus: z.string().optional(),
  summary: z.string().optional(),
});

const patchSchema = z.object({
  type: periodSchema,
  payload: z.record(z.string(), z.unknown()),
});

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const type = new URL(req.url).searchParams.get("type") ?? "all";

  const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
    authResult.supabase
      .from("daily_journals")
      .select("*")
      .eq("user_id", authResult.userId)
      .order("journal_date", { ascending: false }),
    authResult.supabase
      .from("weekly_reviews")
      .select("*")
      .eq("user_id", authResult.userId)
      .order("review_date", { ascending: false }),
    authResult.supabase
      .from("monthly_reviews")
      .select("*")
      .eq("user_id", authResult.userId)
      .order("review_date", { ascending: false }),
  ]);

  if (dailyRes.error || weeklyRes.error || monthlyRes.error) {
    return NextResponse.json(
      { error: dailyRes.error?.message ?? weeklyRes.error?.message ?? monthlyRes.error?.message },
      { status: 500 }
    );
  }

  const daily = (dailyRes.data ?? []).map((d) => ({
    id: d.id,
    date: d.journal_date,
    mood: d.mood_score ?? undefined,
    energy: d.metadata?.energy ?? undefined,
    gratitudes: d.gratitudes ?? "",
    wins: d.wins ?? "",
    lesson: d.lesson ?? "",
    tomorrowPlan: d.tomorrow_plan ?? "",
    note: d.notes ?? "",
  }));
  const weekly = (weeklyRes.data ?? []).map((w) => ({
    id: w.id,
    date: w.review_date,
    period: "weekly" as const,
    wins: w.wins ?? "",
    challenges: w.failures ?? "",
    lessons: w.biggest_lesson ?? "",
    nextFocus: w.next_week_focus ?? "",
    summary: (w.metadata as Record<string, unknown> | null)?.summary ?? "",
  }));
  const monthly = (monthlyRes.data ?? []).map((m) => ({
    id: m.id,
    date: m.review_date,
    period: "monthly" as const,
    wins: m.top_wins ?? "",
    challenges: m.stop_doing ?? "",
    lessons: m.lessons ?? "",
    nextFocus: m.next_focus ?? "",
    summary: (m.metadata as Record<string, unknown> | null)?.summary ?? "",
  }));

  if (type === "daily") return NextResponse.json({ daily });
  if (type === "weekly") return NextResponse.json({ reviews: weekly });
  if (type === "monthly") return NextResponse.json({ reviews: monthly });
  return NextResponse.json({ daily, reviews: [...weekly, ...monthly] });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const type = periodSchema.parse(body?.type);

  if (type === "daily") {
    const parsed = dailySchema.parse(body.payload);
    const id = parsed.id ?? uid();
    const { error } = await authResult.supabase.from("daily_journals").upsert({
      id,
      user_id: authResult.userId,
      journal_date: parsed.date,
      mood_score: parsed.mood ?? null,
      gratitudes: parsed.gratitudes ?? null,
      wins: parsed.wins ?? null,
      lesson: parsed.lesson ?? null,
      tomorrow_plan: parsed.tomorrowPlan ?? null,
      notes: parsed.note ?? null,
      metadata: { energy: parsed.energy ?? null },
      domain_id: "domain_self_dev",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  const parsed = reviewSchema.parse(body.payload);
  const id = parsed.id ?? uid();

  if (type === "weekly" || type === "quarterly" || type === "annual") {
    const { error } = await authResult.supabase.from("weekly_reviews").upsert({
      id,
      user_id: authResult.userId,
      review_date: parsed.date,
      wins: parsed.wins ?? null,
      failures: parsed.challenges ?? null,
      biggest_lesson: parsed.lessons ?? null,
      next_week_focus: parsed.nextFocus ?? null,
      metadata: { summary: parsed.summary ?? "", period: type },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  const { error } = await authResult.supabase.from("monthly_reviews").upsert({
    id,
    user_id: authResult.userId,
    review_date: parsed.date,
    month_name: new Date(parsed.date).toLocaleDateString("ar-SA", { month: "long" }),
    top_wins: parsed.wins ?? null,
    stop_doing: parsed.challenges ?? null,
    lessons: parsed.lessons ?? null,
    next_focus: parsed.nextFocus ?? null,
    metadata: { summary: parsed.summary ?? "", period: type },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = patchSchema.parse(await req.json());
  const payload = body.payload;
  const id = String(payload.id ?? "");
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

  if (body.type === "daily") {
    const parsed = dailySchema.partial().extend({ id: z.string() }).parse(payload);
    const updates: Record<string, unknown> = {};
    if (parsed.date !== undefined) updates.journal_date = parsed.date;
    if (parsed.mood !== undefined) updates.mood_score = parsed.mood;
    if (parsed.gratitudes !== undefined) updates.gratitudes = parsed.gratitudes || null;
    if (parsed.wins !== undefined) updates.wins = parsed.wins || null;
    if (parsed.lesson !== undefined) updates.lesson = parsed.lesson || null;
    if (parsed.tomorrowPlan !== undefined) updates.tomorrow_plan = parsed.tomorrowPlan || null;
    if (parsed.note !== undefined) updates.notes = parsed.note || null;
    if (parsed.energy !== undefined) updates.metadata = { energy: parsed.energy };
    const { error } = await authResult.supabase
      .from("daily_journals")
      .update(updates)
      .eq("id", parsed.id)
      .eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const parsed = reviewSchema.partial().extend({ id: z.string() }).parse(payload);
  const updates: Record<string, unknown> = {};
  if (parsed.date !== undefined) updates.review_date = parsed.date;
  if (parsed.wins !== undefined) {
    updates.wins = parsed.wins || null;
    updates.top_wins = parsed.wins || null;
  }
  if (parsed.challenges !== undefined) {
    updates.failures = parsed.challenges || null;
    updates.stop_doing = parsed.challenges || null;
  }
  if (parsed.lessons !== undefined) {
    updates.biggest_lesson = parsed.lessons || null;
    updates.lessons = parsed.lessons || null;
  }
  if (parsed.nextFocus !== undefined) {
    updates.next_week_focus = parsed.nextFocus || null;
    updates.next_focus = parsed.nextFocus || null;
  }
  if (parsed.summary !== undefined) {
    updates.metadata = { summary: parsed.summary };
  }

  const table =
    body.type === "monthly" ? "monthly_reviews" : "weekly_reviews";
  const cleanUpdates =
    table === "monthly_reviews"
      ? {
          review_date: updates.review_date,
          top_wins: updates.top_wins,
          stop_doing: updates.stop_doing,
          lessons: updates.lessons,
          next_focus: updates.next_focus,
          metadata: updates.metadata,
        }
      : {
          review_date: updates.review_date,
          wins: updates.wins,
          failures: updates.failures,
          biggest_lesson: updates.biggest_lesson,
          next_week_focus: updates.next_week_focus,
          metadata: updates.metadata,
        };

  const { error } = await authResult.supabase
    .from(table)
    .update(cleanUpdates)
    .eq("id", parsed.id)
    .eq("user_id", authResult.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const url = new URL(req.url);
  const type = periodSchema.parse(url.searchParams.get("type"));
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

  const table =
    type === "daily"
      ? "daily_journals"
      : type === "monthly"
        ? "monthly_reviews"
        : "weekly_reviews";

  const { error } = await authResult.supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
