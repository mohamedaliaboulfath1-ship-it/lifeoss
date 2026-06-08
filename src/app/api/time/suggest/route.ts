import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { loadTimeSettings } from "@/lib/time/settings";
import { suggestSlots } from "@/lib/time/scheduler";

const schema = z.object({
  durationMinutes: z.number().int().positive(),
  taskId: z.string().optional(),
  title: z.string().optional(),
  domainId: z.string().optional(),
  goalId: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const body = schema.parse(await req.json());
  const settings = await loadTimeSettings(auth.supabase, auth.userId);

  const { data: existing } = await auth.supabase
    .from("time_blocks")
    .select("start_at, end_at")
    .eq("user_id", auth.userId)
    .gte("start_at", new Date().toISOString().slice(0, 10));

  const suggestions = suggestSlots(settings, existing ?? [], body.durationMinutes);
  return NextResponse.json({ suggestions });
}
