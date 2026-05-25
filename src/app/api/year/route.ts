import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getOrCreateLifeYear, saveLifeYearPayload } from "@/lib/year-data";
import type { YearPayload } from "@/types/lifeos";

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  let year: string | null = searchParams.get("year");

  if (!year) {
    const { data: profile } = await authResult.supabase
      .from("profiles")
      .select("current_year")
      .eq("id", authResult.userId)
      .single();
    year = profile?.current_year ?? String(new Date().getFullYear());
  }

  const safeYear = year ?? String(new Date().getFullYear());
  const { data, record } = await getOrCreateLifeYear(
    authResult.userId,
    safeYear
  );
  return NextResponse.json({ year: safeYear, data, updatedAt: record.updated_at });
}

const putSchema = z.object({
  year: z.string(),
  data: z.record(z.unknown()).optional(),
  merge: z.boolean().optional(),
});

export async function PUT(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = putSchema.parse(await req.json());
  const { data: existing } = await getOrCreateLifeYear(
    authResult.userId,
    body.year
  );

  const next: YearPayload = body.merge
    ? { ...existing, ...(body.data as Partial<YearPayload>) }
    : ({ ...existing, ...body.data } as YearPayload);

  await saveLifeYearPayload(authResult.userId, body.year, next);
  return NextResponse.json({ ok: true, year: body.year, data: next });
}
