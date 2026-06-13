import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { runMohamedBooksLibrarySeed } from "@/lib/seed/run-mohamed-books-library";

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const force = new URL(req.url).searchParams.get("force") === "1";

  try {
    const result = await runMohamedBooksLibrarySeed(auth.supabase, auth.userId, { force });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل بذر المكتبة";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
