import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  JournalBlock,
  JournalEntry,
  JournalEntrySummary,
  JournalImage,
  JournalRelation,
} from "@/types/journal";
import { calcReadingTimeMin, calcWordCount } from "./blocks";

export function mapBlockRow(row: Record<string, unknown>): JournalBlock {
  const meta = (row.metadata as Record<string, unknown> | null) ?? {};
  return {
    id: String(row.id),
    type: row.block_type as JournalBlock["type"],
    content: String(row.content ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    parentId: (row.parent_id as string | null) ?? null,
    checked: row.checked != null ? Boolean(row.checked) : undefined,
    items: meta.items as string[] | undefined,
    children: meta.children as JournalBlock[] | undefined,
    metadata: meta,
  };
}

export function blockToRow(
  block: JournalBlock,
  userId: string,
  entryId: string
): Record<string, unknown> {
  const meta = { ...(block.metadata ?? {}) };
  if (block.items) meta.items = block.items;
  if (block.children) meta.children = block.children;
  return {
    id: block.id,
    user_id: userId,
    entry_id: entryId,
    block_type: block.type,
    content: block.content,
    sort_order: block.sortOrder,
    parent_id: block.parentId ?? null,
    checked: block.checked ?? null,
    metadata: meta,
  };
}

export async function signCoverUrl(
  db: SupabaseClient,
  path: string | null | undefined
): Promise<string | null> {
  if (!path) return null;
  const { data } = await db.storage.from("journal-media").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function signImageUrls(
  db: SupabaseClient,
  images: JournalImage[]
): Promise<JournalImage[]> {
  return Promise.all(
    images.map(async (img) => {
      const { data } = await db.storage
        .from("journal-media")
        .createSignedUrl(img.storagePath, 3600);
      return { ...img, url: data?.signedUrl ?? undefined };
    })
  );
}

export function mapEntrySummary(
  row: Record<string, unknown>,
  tags: string[] = [],
  coverUrl?: string | null
): JournalEntrySummary {
  return {
    id: String(row.id),
    title: String(row.title),
    subtitle: (row.subtitle as string | null) ?? null,
    category: row.category as JournalEntrySummary["category"],
    coverUrl: coverUrl ?? null,
    status: String(row.status),
    isDaily: Boolean(row.is_daily),
    journalDate: (row.journal_date as string | null) ?? null,
    wordCount: Number(row.word_count ?? 0),
    readingTimeMin: Number(row.reading_time_min ?? 1),
    tags,
    updatedAt: String(row.updated_at),
  };
}

export async function loadJournalEntry(
  db: SupabaseClient,
  userId: string,
  entryId: string
): Promise<JournalEntry | null> {
  const { data: entry } = await db
    .from("journal_entries")
    .select("*")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!entry) return null;

  const [{ data: blocks }, { data: relations }, { data: images }, { data: tags }] =
    await Promise.all([
      db
        .from("journal_blocks")
        .select("*")
        .eq("entry_id", entryId)
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
      db.from("journal_relations").select("*").eq("entry_id", entryId).eq("user_id", userId),
      db
        .from("journal_images")
        .select("*")
        .eq("entry_id", entryId)
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
      db.from("journal_tags").select("tag").eq("entry_id", entryId).eq("user_id", userId),
    ]);

  const coverUrl = await signCoverUrl(db, entry.cover_image_path as string | null);
  const mappedImages: JournalImage[] = await signImageUrls(
    db,
    (images ?? []).map((img) => ({
      id: img.id as string,
      entryId,
      blockId: (img.block_id as string | null) ?? null,
      storagePath: img.storage_path as string,
      caption: (img.caption as string | null) ?? undefined,
      sortOrder: Number(img.sort_order ?? 0),
      fullWidth: Boolean(img.full_width),
      metadata: (img.metadata as Record<string, unknown>) ?? {},
    }))
  );

  return {
    id: entry.id as string,
    title: entry.title as string,
    subtitle: (entry.subtitle as string | null) ?? null,
    author: (entry.author as string | null) ?? null,
    category: entry.category as JournalEntry["category"],
    coverImagePath: (entry.cover_image_path as string | null) ?? null,
    coverUrl,
    status: entry.status as JournalEntry["status"],
    isDaily: Boolean(entry.is_daily),
    journalDate: (entry.journal_date as string | null) ?? null,
    wordCount: Number(entry.word_count ?? 0),
    readingTimeMin: Number(entry.reading_time_min ?? 1),
    tags: (tags ?? []).map((t) => t.tag as string),
    blocks: (blocks ?? []).map((b) => mapBlockRow(b as Record<string, unknown>)),
    relations: (relations ?? []).map((r) => ({
      id: r.id as string,
      entryId,
      blockId: (r.block_id as string | null) ?? null,
      targetType: r.target_type as JournalRelation["targetType"],
      targetId: r.target_id as string,
      label: (r.label as string | null) ?? undefined,
    })),
    images: mappedImages,
    createdAt: entry.created_at as string,
    updatedAt: entry.updated_at as string,
  };
}

export async function saveJournalEntry(
  db: SupabaseClient,
  userId: string,
  payload: {
    id: string;
    title: string;
    subtitle?: string | null;
    author?: string | null;
    category: string;
    coverImagePath?: string | null;
    status?: string;
    isDaily?: boolean;
    journalDate?: string | null;
    tags?: string[];
    blocks: JournalBlock[];
    relations?: Omit<JournalRelation, "id" | "entryId">[];
  }
) {
  const wordCount = calcWordCount(payload.blocks);
  const readingTimeMin = calcReadingTimeMin(wordCount);

  const { error: entryErr } = await db.from("journal_entries").upsert({
    id: payload.id,
    user_id: userId,
    title: payload.title,
    subtitle: payload.subtitle ?? null,
    author: payload.author ?? null,
    category: payload.category,
    cover_image_path: payload.coverImagePath ?? null,
    status: payload.status ?? "draft",
    is_daily: payload.isDaily ?? false,
    journal_date: payload.journalDate ?? null,
    word_count: wordCount,
    reading_time_min: readingTimeMin,
    updated_at: new Date().toISOString(),
  });

  if (entryErr) throw new Error(entryErr.message);

  await db.from("journal_blocks").delete().eq("entry_id", payload.id).eq("user_id", userId);
  const blockRows = payload.blocks.map((b) => blockToRow(b, userId, payload.id));
  if (blockRows.length) {
    const { error: blockErr } = await db.from("journal_blocks").insert(blockRows);
    if (blockErr) throw new Error(blockErr.message);
  }

  await db.from("journal_tags").delete().eq("entry_id", payload.id).eq("user_id", userId);
  if (payload.tags?.length) {
    const { uid } = await import("@/lib/utils");
    await db.from("journal_tags").insert(
      payload.tags.map((tag) => ({
        id: uid(),
        user_id: userId,
        entry_id: payload.id,
        tag,
      }))
    );
  }

  await db.from("journal_relations").delete().eq("entry_id", payload.id).eq("user_id", userId);
  if (payload.relations?.length) {
    const { uid } = await import("@/lib/utils");
    await db.from("journal_relations").insert(
      payload.relations.map((r) => ({
        id: uid(),
        user_id: userId,
        entry_id: payload.id,
        block_id: r.blockId ?? null,
        target_type: r.targetType,
        target_id: r.targetId,
        label: r.label ?? null,
      }))
    );
  }

  return { wordCount, readingTimeMin };
}
