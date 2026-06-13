import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { searchMentions } from "@/lib/journal/graph";

export async function GET(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const q = new URL(req.url).searchParams.get("q") ?? "";
  const results = await searchMentions(auth.supabase, auth.userId, q);
  return NextResponse.json({ results });
}
