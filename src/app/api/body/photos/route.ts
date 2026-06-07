import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";
import type { PhotoAngle, PhotoTimelineGroup } from "@/types/wealth";

const postSchema = z.object({
  photoDate: z.string(),
  photoAngle: z.enum(["front", "side", "back"]),
  weight: z.number().optional(),
  bodyFatPct: z.number().optional(),
  notes: z.string().optional(),
  imageBase64: z.string().min(20),
});

function parseBase64(data: string) {
  const match = data.match(/^data:(image\/\w+);base64,(.+)$/);
  if (match) return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
  return { mime: "image/jpeg", buffer: Buffer.from(data, "base64") };
}

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { data, error } = await authResult.supabase
    .from("progress_photos")
    .select("*")
    .eq("user_id", authResult.userId)
    .order("photo_date", { ascending: false });

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json({ timeline: [], error: "migration 013 required" }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const withUrls = await Promise.all(
    rows.map(async (r) => {
      let signedUrl: string | undefined;
      if (r.storage_path) {
        const { data: signed } = await authResult.supabase.storage
          .from("progress-photos")
          .createSignedUrl(r.storage_path, 3600);
        signedUrl = signed?.signedUrl;
      }
      return {
        id: r.id,
        photoDate: r.photo_date,
        photoAngle: (r.photo_angle ?? "front") as PhotoAngle,
        weight: r.weight ?? undefined,
        bodyFatPct: r.body_fat_pct ?? undefined,
        notes: r.notes ?? undefined,
        storagePath: r.storage_path ?? undefined,
        signedUrl,
      };
    })
  );

  const groups = new Map<string, PhotoTimelineGroup>();
  for (const p of withUrls) {
    if (!groups.has(p.photoDate)) {
      groups.set(p.photoDate, {
        date: p.photoDate,
        weight: p.weight,
        bodyFatPct: p.bodyFatPct,
        notes: p.notes,
        photos: {},
      });
    }
    const g = groups.get(p.photoDate)!;
    g.photos[p.photoAngle] = p;
    if (p.weight) g.weight = p.weight;
    if (p.bodyFatPct) g.bodyFatPct = p.bodyFatPct;
  }

  return NextResponse.json({
    timeline: [...groups.values()].sort((a, b) => b.date.localeCompare(a.date)),
    photos: withUrls,
  });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = postSchema.parse(await req.json());
  const id = uid();
  const { mime, buffer } = parseBase64(body.imageBase64);
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const storagePath = `${authResult.userId}/${body.photoDate}/${body.photoAngle}.${ext}`;

  const { error: upErr } = await authResult.supabase.storage
    .from("progress-photos")
    .upload(storagePath, buffer, { contentType: mime, upsert: true });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { error } = await authResult.supabase.from("progress_photos").upsert({
    id,
    user_id: authResult.userId,
    photo_date: body.photoDate,
    photo_angle: body.photoAngle,
    weight: body.weight ?? null,
    body_fat_pct: body.bodyFatPct ?? null,
    notes: body.notes ?? null,
    storage_path: storagePath,
    domain_id: "domain_body",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id, storagePath });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

  const { data: row } = await authResult.supabase
    .from("progress_photos")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", authResult.userId)
    .maybeSingle();

  if (row?.storage_path) {
    await authResult.supabase.storage.from("progress-photos").remove([row.storage_path]);
  }

  const { error } = await authResult.supabase
    .from("progress_photos")
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
