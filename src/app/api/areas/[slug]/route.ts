import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { loadAreaHub, loadGoalDrillDown } from "@/lib/areas/load-hub";
import { domainIdFromSlug } from "@/lib/areas/match";
import { SYSTEM_DOMAINS } from "@/lib/domains";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { slug } = await params;
  const goalId = new URL(req.url).searchParams.get("goalId");

  const { data: domains } = await authResult.supabase
    .from("life_domains")
    .select("id, slug, name_ar, icon, color")
    .or(`user_id.is.null,user_id.eq.${authResult.userId}`)
    .eq("is_active", true);

  const areas = domains ?? SYSTEM_DOMAINS.map((d) => ({
    id: d.id,
    slug: d.slug,
    name_ar: d.nameAr,
    icon: d.icon,
    color: d.color,
  }));

  const domainId = domainIdFromSlug(slug, areas);
  if (!domainId) {
    return NextResponse.json({ error: "المجال غير موجود" }, { status: 404 });
  }

  const domain = areas.find((a) => a.id === domainId)!;
  const hub = await loadAreaHub(authResult.supabase, authResult.userId, domainId, domain);

  if (goalId) {
    const drillDown = loadGoalDrillDown(hub, goalId);
    return NextResponse.json({ hub, drillDown });
  }

  return NextResponse.json(hub);
}
