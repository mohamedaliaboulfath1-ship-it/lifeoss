import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";

const bookSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  author: z.string().optional(),
  pages: z.number().int().optional(),
  curPage: z.number().int().optional(),
  status: z.enum(["planned", "reading", "done"]).optional(),
  priority: z.enum(["high", "med", "low"]).optional(),
  notes: z.string().optional(),
});

const sessionSchema = z.object({
  id: z.string().optional(),
  bookId: z.string(),
  date: z.string(),
  pages: z.number().int().positive(),
  durationMin: z.number().int().optional(),
});

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const [booksRes, sessionsRes] = await Promise.all([
    authResult.supabase
      .from("books")
      .select("*")
      .eq("user_id", authResult.userId)
      .order("created_at", { ascending: false }),
    authResult.supabase
      .from("reading_logs")
      .select("*")
      .eq("user_id", authResult.userId)
      .order("log_date", { ascending: false }),
  ]);

  if (booksRes.error || sessionsRes.error) {
    return NextResponse.json(
      { error: booksRes.error?.message ?? sessionsRes.error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    books: (booksRes.data ?? []).map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author ?? undefined,
      pages: b.pages_total ?? undefined,
      curPage: b.pages_read ?? 0,
      status: b.status,
      priority: b.priority,
      notes: b.notes ?? undefined,
    })),
    sessions: (sessionsRes.data ?? []).map((s) => ({
      id: s.id,
      bookId: s.book_id,
      date: s.log_date,
      pages: s.pages,
      durationMin: s.duration_min ?? 0,
    })),
  });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const entity = body.entity as string;

  if (entity === "book") {
    const parsed = bookSchema.parse(body.payload);
    const id = parsed.id ?? uid();
    const { error } = await authResult.supabase.from("books").upsert({
      id,
      user_id: authResult.userId,
      title: parsed.title,
      author: parsed.author ?? null,
      pages_total: parsed.pages ?? null,
      pages_read: parsed.curPage ?? 0,
      status: parsed.status ?? "planned",
      priority: parsed.priority ?? "med",
      notes: parsed.notes ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  const parsed = sessionSchema.parse(body.payload);
  const id = parsed.id ?? uid();

  const { data: book } = await authResult.supabase
    .from("books")
    .select("pages_total, pages_read")
    .eq("id", parsed.bookId)
    .eq("user_id", authResult.userId)
    .maybeSingle();

  const pagesTotal = book?.pages_total ?? 200;
  const newCur = Math.min(pagesTotal, (book?.pages_read ?? 0) + parsed.pages);
  const newStatus = newCur >= pagesTotal ? "done" : "reading";

  const { error: sessionError } = await authResult.supabase.from("reading_logs").insert({
    id,
    user_id: authResult.userId,
    book_id: parsed.bookId,
    log_date: parsed.date,
    pages: parsed.pages,
    duration_min: parsed.durationMin ?? null,
  });
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });

  await authResult.supabase
    .from("books")
    .update({ pages_read: newCur, status: newStatus })
    .eq("id", parsed.bookId)
    .eq("user_id", authResult.userId);

  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const { id, curPage, status } = body as {
    id: string;
    curPage?: number;
    status?: string;
  };

  const updates: Record<string, unknown> = {};
  if (curPage !== undefined) updates.pages_read = curPage;
  if (status !== undefined) updates.status = status;

  const { error } = await authResult.supabase
    .from("books")
    .update(updates)
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const url = new URL(req.url);
  const entity = url.searchParams.get("entity") ?? "book";
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  if (entity === "session") {
    const { error } = await authResult.supabase
      .from("reading_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  await authResult.supabase
    .from("reading_logs")
    .delete()
    .eq("book_id", id)
    .eq("user_id", authResult.userId);

  const { error } = await authResult.supabase
    .from("books")
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
