import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getUserContext } from "@/lib/year-data";
import { buildAiInsights, buildExecutiveBrief } from "@/lib/ai/engine";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  try {
    const ctx = await getUserContext(authResult.userId);
    const insights = buildAiInsights(ctx.yearData, ctx.dashboard);
    const brief = buildExecutiveBrief(ctx.dashboard, insights);
    return NextResponse.json({ brief, insights });
  } catch (e) {
    console.error("GET /api/v1/ai/brief", e);
    return NextResponse.json({ error: "فشل إنشاء الملخص التنفيذي" }, { status: 500 });
  }
}
