import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { loadTimeOverview, autoRescheduleMissed } from "@/lib/time/load-time-os";
import { loadTimeSettings } from "@/lib/time/settings";

export async function GET(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const autoReschedule = new URL(req.url).searchParams.get("reschedule") === "1";
  if (autoReschedule) {
    const settings = await loadTimeSettings(auth.supabase, auth.userId);
    await autoRescheduleMissed(auth.supabase, auth.userId, settings);
  }

  const overview = await loadTimeOverview(auth.supabase, auth.userId);
  return NextResponse.json(overview);
}
