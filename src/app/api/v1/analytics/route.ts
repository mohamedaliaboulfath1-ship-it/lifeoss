import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { computeFullAnalytics } from "@/lib/analytics/score-engine";
import { getYearForUser } from "@/lib/year-data";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { data } = await getYearForUser(authResult.userId);
  const analytics = computeFullAnalytics(data);

  try {
    await authResult.supabase.from("daily_scores").upsert(
      {
        user_id: authResult.userId,
        score_date: new Date().toISOString().slice(0, 10),
        discipline_score: analytics.domainScores.discipline,
        health_score: analytics.domainScores.health,
        finance_score: analytics.domainScores.finance,
        learning_score: analytics.domainScores.learning,
        career_score: analytics.domainScores.career,
        life_score: analytics.domainScores.life,
      },
      { onConflict: "user_id,score_date" }
    );
  } catch {
    /* daily_scores unique index may not exist until migration 009 */
  }

  return NextResponse.json(analytics);
}
