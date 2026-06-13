import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const entryId = form.get("entryId") as string | null;
  const blockId = (form.get("blockId") as string | null) ?? null;
  const caption = (form.get("caption") as string | null) ?? null;
  const fullWidth = form.get("fullWidth") === "true";

  if (!file || !entryId) {
    return NextResponse.json({ error: "file و entryId مطلوبان" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${auth.userId}/${entryId}/${uid()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await auth.supabase.storage
    .from("journal-media")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const imageId = uid();
  const { error: dbErr } = await auth.supabase.from("journal_images").insert({
    id: imageId,
    user_id: auth.userId,
    entry_id: entryId,
    block_id: blockId,
    storage_path: path,
    caption,
    full_width: fullWidth,
    sort_order: Date.now(),
  });

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  const { data: signed } = await auth.supabase.storage
    .from("journal-media")
    .createSignedUrl(path, 3600);

  return NextResponse.json({
    ok: true,
    image: {
      id: imageId,
      entryId,
      blockId,
      storagePath: path,
      url: signed?.signedUrl,
      caption,
      fullWidth,
    },
  });
}
