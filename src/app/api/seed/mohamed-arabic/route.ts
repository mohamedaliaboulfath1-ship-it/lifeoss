import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { runMohamedArabicSeed } from "@/lib/seed/run-mohamed-arabic";

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const force = new URL(req.url).searchParams.get("force") === "1";

  try {
    const result = await runMohamedArabicSeed(auth.supabase, auth.userId, { force });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل البذر";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
