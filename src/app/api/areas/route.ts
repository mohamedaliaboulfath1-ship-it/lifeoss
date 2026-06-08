import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { SYSTEM_DOMAINS } from "@/lib/domains";
import { uid } from "@/lib/utils";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { data, error } = await authResult.supabase
    .from("life_domains")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${authResult.userId}`)
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json({
        areas: SYSTEM_DOMAINS.map((d) => ({
          id: d.id,
          slug: d.slug,
          nameAr: d.nameAr,
          nameEn: d.nameEn,
          icon: d.icon,
          color: d.color,
          isSystem: true,
          isActive: true,
          sortOrder: d.sortOrder,
        })),
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const areas = (data ?? []).map((d) => ({
    id: d.id,
    slug: d.slug,
    nameAr: d.name_ar,
    nameEn: d.name_en,
    icon: d.icon,
    color: d.color,
    isSystem: d.is_system,
    isActive: d.is_active,
    sortOrder: d.sort_order,
  }));

  return NextResponse.json({ areas });
}

const areaSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
});

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = areaSchema.parse(await req.json());
  const id = body.id ?? `domain_custom_${uid()}`;

  const { error } = await authResult.supabase.from("life_domains").upsert({
    id,
    user_id: authResult.userId,
    slug: body.slug,
    name_ar: body.nameAr,
    name_en: body.nameEn ?? body.nameAr,
    icon: body.icon ?? "📌",
    color: body.color ?? "#94a3b8",
    sort_order: body.sortOrder ?? 99,
    is_system: false,
    is_active: true,
    score_weight: 1,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id });
}

const patchSchema = z.object({
  id: z.string(),
  nameAr: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = patchSchema.parse(await req.json());
  const updates: Record<string, unknown> = {};
  if (body.nameAr) updates.name_ar = body.nameAr;
  if (body.icon) updates.icon = body.icon;
  if (body.color) updates.color = body.color;
  if (body.isActive != null) updates.is_active = body.isActive;

  const { error } = await authResult.supabase
    .from("life_domains")
    .update(updates)
    .eq("id", body.id)
    .or(`user_id.eq.${authResult.userId},user_id.is.null`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
