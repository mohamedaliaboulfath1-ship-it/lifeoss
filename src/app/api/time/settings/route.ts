import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { loadTimeSettings, upsertTimeSettings } from "@/lib/time/settings";

const schema = z.object({
  sleepHours: z.number().min(4).max(12).optional(),
  commuteMinutes: z.number().min(0).max(180).optional(),
  workDays: z.array(z.number().min(0).max(6)).optional(),
  workStart: z.string().optional(),
  workEnd: z.string().optional(),
  satWorkEnabled: z.boolean().optional(),
  satWorkStart: z.string().optional(),
  satWorkEnd: z.string().optional(),
  friOff: z.boolean().optional(),
  homeArrival: z.string().optional(),
  timezone: z.string().optional(),
});

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const settings = await loadTimeSettings(auth.supabase, auth.userId);
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const body = schema.parse(await req.json());
  const settings = await upsertTimeSettings(auth.supabase, auth.userId, body);
  return NextResponse.json({ settings });
}
