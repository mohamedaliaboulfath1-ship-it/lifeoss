import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getUserContext } from "@/lib/year-data";
import { buildAiInsights } from "@/lib/ai/engine";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  try {
    const ctx = await getUserContext(authResult.userId);
    const insights = buildAiInsights(ctx.yearData, ctx.dashboard);
    return NextResponse.json({ insights });
  } catch (e) {
    console.error("GET /api/v1/ai/insights", e);
    return NextResponse.json({ error: "فشل توليد الرؤى" }, { status: 500 });
  }
}
