import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid, today } from "@/lib/utils";
import { blocksFromTemplate, defaultBlocks } from "@/lib/journal/blocks";
import { mapEntrySummary, saveJournalEntry, signCoverUrl } from "@/lib/journal/mapper";

const createSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  category: z.string().default("journal"),
  templateId: z.string().optional(),
  isDaily: z.boolean().optional(),
  journalDate: z.string().optional(),
  blocks: z.array(z.record(z.unknown())).optional(),
});

export async function GET(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const q = url.searchParams.get("q")?.trim().toLowerCase();
  const daily = url.searchParams.get("daily");

  let query = auth.supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", auth.userId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (category && category !== "all") query = query.eq("category", category);
  if (daily === "1") query = query.eq("is_daily", true);

  const { data, error } = await query;
  if (error) {
    const missing = error.message.includes("does not exist");
    return NextResponse.json(
      { error: error.message, migrationRequired: missing, entries: [] },
      { status: missing ? 400 : 500 }
    );
  }

  const entryIds = (data ?? []).map((e) => e.id as string);
  const { data: tagRows } = entryIds.length
    ? await auth.supabase.from("journal_tags").select("entry_id, tag").in("entry_id", entryIds)
    : { data: [] };

  const tagsByEntry = new Map<string, string[]>();
  for (const t of tagRows ?? []) {
    const list = tagsByEntry.get(t.entry_id as string) ?? [];
    list.push(t.tag as string);
    tagsByEntry.set(t.entry_id as string, list);
  }

  let entries = await Promise.all(
    (data ?? []).map(async (row) => {
      const coverUrl = await signCoverUrl(auth.supabase, row.cover_image_path as string | null);
      return mapEntrySummary(row as Record<string, unknown>, tagsByEntry.get(row.id as string) ?? [], coverUrl);
    })
  );

  if (q) {
    entries = entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.subtitle ?? "").toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  const { data: templates } = await auth.supabase
    .from("journal_templates")
    .select("id, name, category, description, blocks, is_system")
    .or(`is_system.eq.true,user_id.eq.${auth.userId}`)
    .order("name");

  return NextResponse.json({
    entries,
    templates: (templates ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description,
      blocks: t.blocks,
      isSystem: t.is_system,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const body = createSchema.parse(await req.json());
  const id = uid();
  const date = body.journalDate ?? (body.isDaily ? today() : undefined);

  if (body.isDaily && date) {
    const { data: existing } = await auth.supabase
      .from("journal_entries")
      .select("id")
      .eq("user_id", auth.userId)
      .eq("is_daily", true)
      .eq("journal_date", date)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true, id: existing.id, existing: true });
    }
  }

  let blocks = defaultBlocks();
  if (body.blocks?.length) {
    blocks = blocksFromTemplate(body.blocks as Parameters<typeof blocksFromTemplate>[0]);
  } else if (body.templateId) {
    const { data: tpl } = await auth.supabase
      .from("journal_templates")
      .select("blocks")
      .eq("id", body.templateId)
      .maybeSingle();
    if (tpl?.blocks) {
      blocks = blocksFromTemplate(tpl.blocks as Parameters<typeof blocksFromTemplate>[0]);
    }
  }

  const title =
    body.title ??
    (body.isDaily && date ? date : "مذكرة جديدة");

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("display_name")
    .eq("id", auth.userId)
    .maybeSingle();

  await saveJournalEntry(auth.supabase, auth.userId, {
    id,
    title,
    subtitle: body.subtitle,
    author: profile?.display_name ?? null,
    category: body.category,
    isDaily: body.isDaily ?? false,
    journalDate: date ?? null,
    status: "draft",
    blocks,
  });

  return NextResponse.json({ ok: true, id });
}
