import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { loadJournalEntry, saveJournalEntry } from "@/lib/journal/mapper";
import type { JournalBlock, JournalRelation } from "@/types/journal";

const blockSchema = z.object({
  id: z.string(),
  type: z.string(),
  content: z.string(),
  sortOrder: z.number(),
  parentId: z.string().nullable().optional(),
  checked: z.boolean().optional(),
  items: z.array(z.string()).optional(),
  children: z.array(z.record(z.unknown())).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  category: z.string().optional(),
  coverImagePath: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  tags: z.array(z.string()).optional(),
  blocks: z.array(blockSchema).optional(),
  relations: z
    .array(
      z.object({
        blockId: z.string().nullable().optional(),
        targetType: z.enum(["goal", "project", "task", "book", "habit", "area"]),
        targetId: z.string(),
        label: z.string().optional(),
      })
    )
    .optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const entry = await loadJournalEntry(auth.supabase, auth.userId, id);
  if (!entry) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  return NextResponse.json({ entry });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const existing = await loadJournalEntry(auth.supabase, auth.userId, id);
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const body = patchSchema.parse(await req.json());

  const stats = await saveJournalEntry(auth.supabase, auth.userId, {
    id,
    title: body.title ?? existing.title,
    subtitle: body.subtitle !== undefined ? body.subtitle : existing.subtitle,
    author: body.author !== undefined ? body.author : existing.author,
    category: body.category ?? existing.category,
    coverImagePath:
      body.coverImagePath !== undefined ? body.coverImagePath : existing.coverImagePath,
    status: body.status ?? existing.status,
    isDaily: existing.isDaily,
    journalDate: existing.journalDate,
    tags: body.tags ?? existing.tags,
    blocks: (body.blocks as JournalBlock[] | undefined) ?? existing.blocks,
    relations: (body.relations as Omit<JournalRelation, "id" | "entryId">[] | undefined) ??
      existing.relations.map(({ blockId, targetType, targetId, label }) => ({
        blockId,
        targetType,
        targetId,
        label,
      })),
  });

  const entry = await loadJournalEntry(auth.supabase, auth.userId, id);
  return NextResponse.json({ ok: true, entry, ...stats });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const { error } = await auth.supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
