import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { runJournalAi } from "@/lib/journal/ai";
import type { JournalBlock } from "@/types/journal";

const schema = z.object({
  action: z.enum([
    "summarize",
    "rewrite",
    "expand",
    "translate",
    "extract_tasks",
    "extract_goals",
    "extract_habits",
    "action_plan",
  ]),
  title: z.string().default(""),
  blocks: z.array(z.record(z.unknown())).default([]),
});

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const body = schema.parse(await req.json());
  const result = await runJournalAi(
    body.action,
    body.blocks as unknown as JournalBlock[],
    body.title
  );

  return NextResponse.json(result);
}
