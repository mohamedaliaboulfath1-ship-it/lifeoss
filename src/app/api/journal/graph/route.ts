import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { buildJournalGraph } from "@/lib/journal/graph";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const graph = await buildJournalGraph(auth.supabase, auth.userId);
  return NextResponse.json(graph);
}
