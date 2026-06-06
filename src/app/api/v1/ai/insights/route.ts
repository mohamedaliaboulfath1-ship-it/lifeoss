import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getUserContext } from "@/lib/year-data";
import { loadAiConfig, resolveAiProvider } from "@/lib/ai/provider";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  try {
    const ctx = await getUserContext(authResult.userId);
    const config = await loadAiConfig(authResult.supabase, authResult.userId);
    const provider = resolveAiProvider(config);
    const insights = await provider.generateInsights(ctx.yearData, ctx.dashboard);
    return NextResponse.json({ insights, provider: config.provider, status: config.status });
  } catch (e) {
    console.error("GET /api/v1/ai/insights", e);
    return NextResponse.json({ error: "فشل توليد الرؤى" }, { status: 500 });
  }
}
