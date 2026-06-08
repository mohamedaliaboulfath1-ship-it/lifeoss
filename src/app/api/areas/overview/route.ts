import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { loadAreasOverview } from "@/lib/areas/load-hub";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const previews = await loadAreasOverview(authResult.supabase, authResult.userId);
  return NextResponse.json({ previews });
}
