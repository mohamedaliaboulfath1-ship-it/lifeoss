import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { buildBookMetadata, mapBookRow } from "@/lib/books/map-book";
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
  bookType: z
    .enum(["physical", "ebook", "pdf", "epub", "audiobook", "reference", "novel", "course"])
    .optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  coverPath: z.string().optional(),
  coverUrl: z.string().optional(),
  language: z.string().optional(),
  description: z.string().optional(),
  estimatedReadingHours: z.number().optional(),
  publishYear: z.number().int().optional(),
  goodreadsRating: z.number().optional(),
  purchaseUrl: z.string().optional(),
  readingPhase: z.number().int().optional(),
  readingPlanOrder: z.number().int().optional(),
  highlights: z
    .array(
      z.object({
        id: z.string().optional(),
        excerpt: z.string().optional(),
        note: z.string().optional(),
        page: z.number().int().optional(),
      })
    )
    .optional(),
});

const sessionSchema = z.object({
  id: z.string().optional(),
  bookId: z.string(),
  date: z.string(),
  pages: z.number().int().positive(),
  durationMin: z.number().int().optional(),
});

type BookPayload = z.infer<typeof bookSchema>;

function metadataFromPayload(parsed: BookPayload, curPage = 0) {
  const pages = parsed.pages ?? 0;
  const progressPct = pages > 0 ? Math.round((curPage / pages) * 100) : 0;
  return buildBookMetadata({
    language: parsed.language,
    description: parsed.description ?? parsed.notes,
    estimatedReadingHours: parsed.estimatedReadingHours,
    coverUrl: parsed.coverUrl,
    publishYear: parsed.publishYear,
    goodreadsRating: parsed.goodreadsRating,
    purchaseUrl: parsed.purchaseUrl,
    readingPhase: parsed.readingPhase,
    readingPlanOrder: parsed.readingPlanOrder,
    progressPct,
  });
}

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

  const books = await Promise.all(
    (booksRes.data ?? []).map(async (b) => {
      let coverUrl: string | undefined;
      if (b.cover_path) {
        const { data: signed } = await authResult.supabase.storage
          .from("book-covers")
          .createSignedUrl(b.cover_path, 3600);
        coverUrl = signed?.signedUrl;
      }
      return mapBookRow(b as Record<string, unknown>, coverUrl);
    })
  );

  return NextResponse.json({
    books,
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

    if (parsed.id) {
      const { data: existing } = await authResult.supabase
        .from("books")
        .select("metadata, pages_read")
        .eq("id", parsed.id)
        .eq("user_id", authResult.userId)
        .maybeSingle();

      const cur = parsed.curPage ?? existing?.pages_read ?? 0;
      const prevMeta = (existing?.metadata as Record<string, unknown> | null) ?? {};
      const updates: Record<string, unknown> = {
        title: parsed.title,
        author: parsed.author ?? null,
        pages_total: parsed.pages ?? null,
        status: parsed.status ?? "planned",
        priority: parsed.priority ?? "med",
        notes: parsed.notes ?? parsed.description ?? null,
        book_type: parsed.bookType ?? "physical",
        category: parsed.category ?? null,
        tags: parsed.tags ?? [],
        rating: parsed.rating ?? null,
        highlights: parsed.highlights ?? [],
        metadata: { ...prevMeta, ...metadataFromPayload(parsed, cur) },
      };
      if (parsed.curPage !== undefined) updates.pages_read = parsed.curPage;
      if (parsed.coverPath) updates.cover_path = parsed.coverPath;

      const { error } = await authResult.supabase
        .from("books")
        .update(updates)
        .eq("id", parsed.id)
        .eq("user_id", authResult.userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, id: parsed.id });
    }

    const { error } = await authResult.supabase.from("books").insert({
      id,
      user_id: authResult.userId,
      title: parsed.title,
      author: parsed.author ?? null,
      pages_total: parsed.pages ?? null,
      pages_read: parsed.curPage ?? 0,
      status: parsed.status ?? "planned",
      priority: parsed.priority ?? "med",
      notes: parsed.notes ?? parsed.description ?? null,
      book_type: parsed.bookType ?? "physical",
      category: parsed.category ?? null,
      tags: parsed.tags ?? [],
      rating: parsed.rating ?? null,
      cover_path: parsed.coverPath ?? null,
      highlights: parsed.highlights ?? [],
      metadata: metadataFromPayload(parsed, parsed.curPage ?? 0),
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
  const {
    id,
    curPage,
    status,
    title,
    author,
    pages,
    bookType,
    category,
    notes,
    rating,
    coverPath,
    coverUrl,
    language,
    description,
    estimatedReadingHours,
    publishYear,
    goodreadsRating,
    purchaseUrl,
    readingPhase,
    readingPlanOrder,
    priority,
    highlights,
  } = body as BookPayload & { id: string };

  const { data: existing } = await authResult.supabase
    .from("books")
    .select("metadata, pages_read, pages_total")
    .eq("id", id)
    .eq("user_id", authResult.userId)
    .maybeSingle();

  const updates: Record<string, unknown> = {};
  if (curPage !== undefined) updates.pages_read = curPage;
  if (status !== undefined) updates.status = status;
  if (title !== undefined) updates.title = title;
  if (author !== undefined) updates.author = author;
  if (pages !== undefined) updates.pages_total = pages;
  if (bookType !== undefined) updates.book_type = bookType;
  if (category !== undefined) updates.category = category;
  if (notes !== undefined) updates.notes = notes;
  if (description !== undefined) updates.notes = description;
  if (rating !== undefined) updates.rating = rating;
  if (priority !== undefined) updates.priority = priority;
  if (coverPath !== undefined) updates.cover_path = coverPath;
  if (highlights !== undefined) updates.highlights = highlights;

  const nextPages = pages ?? existing?.pages_total ?? 0;
  const nextCur = curPage ?? existing?.pages_read ?? 0;
  const prevMeta = (existing?.metadata as Record<string, unknown> | null) ?? {};
  const metaPatch = buildBookMetadata({
    language,
    description: description ?? notes,
    estimatedReadingHours,
    coverUrl,
    publishYear,
    goodreadsRating,
    purchaseUrl,
    readingPhase,
    readingPlanOrder,
    progressPct: nextPages > 0 ? Math.round((nextCur / nextPages) * 100) : 0,
    seedTag: prevMeta.seedTag as string | undefined,
  });
  if (
    language !== undefined ||
    description !== undefined ||
    notes !== undefined ||
    estimatedReadingHours !== undefined ||
    coverUrl !== undefined ||
    publishYear !== undefined ||
    goodreadsRating !== undefined ||
    purchaseUrl !== undefined ||
    readingPhase !== undefined ||
    readingPlanOrder !== undefined ||
    curPage !== undefined ||
    pages !== undefined
  ) {
    updates.metadata = { ...prevMeta, ...metaPatch };
  }

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
