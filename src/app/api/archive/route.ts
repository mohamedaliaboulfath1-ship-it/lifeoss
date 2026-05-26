import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { computeYearMetrics } from "@/lib/archive/metrics";
import { createYearSnapshot } from "@/lib/archive/snapshot";
import { getOrCreateLifeYear } from "@/lib/year-data";

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const compare = searchParams.get("compare") === "1";
  const previewYear = searchParams.get("preview");

  if (previewYear) {
    const { data } = await getOrCreateLifeYear(authResult.userId, previewYear);
    const metrics = computeYearMetrics(previewYear, data);
    return NextResponse.json({ year: previewYear, metrics });
  }

  const [snapshotsRes, summariesRes] = await Promise.all([
    authResult.supabase
      .from("yearly_snapshots")
      .select("year, label, archived_at")
      .eq("user_id", authResult.userId)
      .order("year", { ascending: false }),
    authResult.supabase
      .from("yearly_summaries")
      .select("year, metrics, updated_at")
      .eq("user_id", authResult.userId)
      .order("year", { ascending: false }),
  ]);

  if (snapshotsRes.error || summariesRes.error) {
    return NextResponse.json(
      {
        error:
          snapshotsRes.error?.message ??
          summariesRes.error?.message ??
          "فشل تحميل الأرشيف",
      },
      { status: 500 }
    );
  }

  if (compare) {
    const years = summariesRes.data ?? [];
    return NextResponse.json({
      snapshots: snapshotsRes.data ?? [],
      summaries: years.map((y) => ({
        year: y.year,
        metrics: y.metrics,
        updatedAt: y.updated_at,
      })),
    });
  }

  return NextResponse.json({
    snapshots: snapshotsRes.data ?? [],
    summaries: summariesRes.data ?? [],
  });
}

const archiveSchema = z.object({
  year: z.string().optional(),
  label: z.string().optional(),
});

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = archiveSchema.parse(await req.json());

  const { data: profile } = await authResult.supabase
    .from("profiles")
    .select("current_year")
    .eq("id", authResult.userId)
    .single();

  const year =
    body.year ?? profile?.current_year ?? String(new Date().getFullYear());

  try {
    const result = await createYearSnapshot(
      authResult.supabase,
      authResult.userId,
      year,
      body.label
    );
    return NextResponse.json({ ok: true, year, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل الأرشفة";
    if (msg.includes("yearly_snapshots") || msg.includes("does not exist")) {
      return NextResponse.json(
        {
          error:
            "جدول الأرشيف غير موجود — شغّل migration 003_archive_preferences.sql في Supabase",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
