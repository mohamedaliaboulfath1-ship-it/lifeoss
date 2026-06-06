import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getOrCreateLifeYear } from "@/lib/year-data";

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
  const { data, record } = await getOrCreateLifeYear(authResult.userId, safeYear);
  return NextResponse.json({ year: safeYear, data, updatedAt: record.updated_at });
}

/** Payload writes removed in Phase 0.5 — use entity APIs. */
export async function PUT() {
  return NextResponse.json(
    {
      error: "PAYLOAD_WRITE_DEPRECATED",
      message: "استخدم APIs الكيانات: /api/tasks, /api/body, /api/nutrition, /api/books, /api/career, /api/learning, /api/finance, /api/reviews",
    },
    { status: 410 }
  );
}
