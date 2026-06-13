import type { SupabaseClient } from "@supabase/supabase-js";
import { buildBookMetadata } from "@/lib/books/map-book";
import {
  MOHAMED_LIBRARY_BOOKS,
  MOHAMED_LIBRARY_SEED_TAG,
  READING_PLAN_PHASES,
} from "@/lib/seed/mohamed-books-library-data";
import { DEFAULT_SEED_EMAIL } from "@/lib/seed/run-mohamed-arabic";

function normalizeTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function isMohamedLibrarySeeded(db: SupabaseClient, userId: string) {
  const { data } = await db
    .from("books")
    .select("id")
    .eq("user_id", userId)
    .contains("metadata", { seedTag: MOHAMED_LIBRARY_SEED_TAG })
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

export async function runMohamedBooksLibrarySeed(
  db: SupabaseClient,
  userId: string,
  options?: { force?: boolean }
) {
  if (await isMohamedLibrarySeeded(db, userId) && !options?.force) {
    return { ok: true as const, alreadySeeded: true, inserted: 0, skipped: MOHAMED_LIBRARY_BOOKS.length };
  }

  const { data: existingRows } = await db
    .from("books")
    .select("id, title")
    .eq("user_id", userId);

  const existingTitles = new Set((existingRows ?? []).map((r) => normalizeTitle(r.title)));
  const existingIds = new Set((existingRows ?? []).map((r) => r.id));

  let inserted = 0;
  let skipped = 0;

  for (const book of MOHAMED_LIBRARY_BOOKS) {
    if (existingIds.has(book.id) || existingTitles.has(normalizeTitle(book.title))) {
      skipped += 1;
      continue;
    }

    const metadata = buildBookMetadata({
      language: book.language,
      description: book.description,
      estimatedReadingHours: book.estimatedReadingHours,
      coverUrl: book.coverUrl,
      publishYear: book.publishYear,
      goodreadsRating: book.goodreadsRating,
      purchaseUrl: book.purchaseUrl,
      readingPhase: book.readingPhase,
      readingPlanOrder: book.readingPlanOrder,
      seedTag: MOHAMED_LIBRARY_SEED_TAG,
      progressPct: 0,
    });

    const goodreadsStars = Math.min(5, Math.max(1, Math.round(book.goodreadsRating)));

    const { error } = await db.from("books").insert({
      id: book.id,
      user_id: userId,
      domain_id: "domain_learning",
      title: book.title,
      author: book.author,
      category: book.category,
      status: "planned",
      priority: book.priority,
      pages_total: book.pages,
      pages_read: 0,
      rating: goodreadsStars,
      notes: book.description,
      book_type: "physical",
      tags: book.tags ?? [],
      metadata,
    });

    if (error) {
      if (error.message.includes("duplicate")) {
        skipped += 1;
        continue;
      }
      throw new Error(`books insert ${book.title}: ${error.message}`);
    }

    inserted += 1;
    existingTitles.add(normalizeTitle(book.title));
    existingIds.add(book.id);
  }

  const { data: profile } = await db
    .from("profiles")
    .select("metadata")
    .eq("id", userId)
    .maybeSingle();

  const prevMeta = (profile?.metadata as Record<string, unknown> | null) ?? {};
  await db
    .from("profiles")
    .update({
      metadata: {
        ...prevMeta,
        booksLibrary: {
          seedTag: MOHAMED_LIBRARY_SEED_TAG,
          seededAt: new Date().toISOString(),
          readingPlan: READING_PLAN_PHASES,
          totalBooks: MOHAMED_LIBRARY_BOOKS.length,
        },
      },
    })
    .eq("id", userId);

  return {
    ok: true as const,
    alreadySeeded: false,
    inserted,
    skipped,
    total: MOHAMED_LIBRARY_BOOKS.length,
  };
}

export async function maybeSeedMohamedBooksLibrary(
  db: SupabaseClient,
  userId: string,
  email?: string | null
) {
  const allowed = process.env.MOHAMED_SEED_EMAIL ?? DEFAULT_SEED_EMAIL;
  if (email && email.toLowerCase() !== allowed.toLowerCase()) {
    return { seeded: false, reason: "email_mismatch" as const };
  }
  if (await isMohamedLibrarySeeded(db, userId)) {
    return { seeded: false, reason: "already_seeded" as const };
  }
  const result = await runMohamedBooksLibrarySeed(db, userId);
  return { seeded: result.inserted > 0, result };
}
