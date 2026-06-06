import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getUserContext } from "@/lib/year-data";
import { buildAiInsights, buildCoachReply } from "@/lib/ai/engine";

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  try {
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const ctx = await getUserContext(authResult.userId);
    const insights = buildAiInsights(ctx.yearData, ctx.dashboard);
    const reply = buildCoachReply(prompt, insights);
    return NextResponse.json({ reply, insights });
  } catch (e) {
    console.error("POST /api/v1/ai/coach", e);
    return NextResponse.json({ error: "فشل المدرب الذكي" }, { status: 500 });
  }
}
