import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getUserContext } from "@/lib/year-data";
import { buildAiInsights, buildExecutiveBrief, buildLifeBriefing } from "@/lib/ai/engine";

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const period = new URL(req.url).searchParams.get("period") as "daily" | "weekly" | "monthly" | null;

  try {
    const ctx = await getUserContext(authResult.userId);
    const insights = buildAiInsights(ctx.yearData, ctx.dashboard);
    const brief = buildExecutiveBrief(ctx.dashboard, insights);

    if (period && ["daily", "weekly", "monthly"].includes(period)) {
      const lifeBriefing = buildLifeBriefing(period, ctx.yearData, ctx.dashboard);
      return NextResponse.json({ briefing: lifeBriefing, brief, insights });
    }

    return NextResponse.json({
      brief,
      insights,
      briefings: {
        daily: buildLifeBriefing("daily", ctx.yearData, ctx.dashboard),
        weekly: buildLifeBriefing("weekly", ctx.yearData, ctx.dashboard),
        monthly: buildLifeBriefing("monthly", ctx.yearData, ctx.dashboard),
      },
    });
  } catch (e) {
    console.error("GET /api/v1/ai/brief", e);
    return NextResponse.json({ error: "فشل إنشاء الملخص التنفيذي" }, { status: 500 });
  }
}
