import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { buildDashboardSnapshot } from "@/lib/dashboard/snapshot";
import { getOrCreateLifeYear } from "@/lib/year-data";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  try {
    const { data: profile } = await authResult.supabase
      .from("profiles")
      .select("display_name, current_year")
      .eq("id", authResult.userId)
      .single();

    const year = profile?.current_year ?? String(new Date().getFullYear());
    const { data: yearData } = await getOrCreateLifeYear(authResult.userId, year);

    const snapshot = await buildDashboardSnapshot(
      authResult.supabase,
      authResult.userId,
      profile?.display_name ?? "مستخدم",
      yearData
    );

    return NextResponse.json(snapshot);
  } catch (e) {
    console.error("GET /api/v1/dashboard:", e);
    return NextResponse.json({ error: "فشل تحميل لوحة التحكم" }, { status: 500 });
  }
}
