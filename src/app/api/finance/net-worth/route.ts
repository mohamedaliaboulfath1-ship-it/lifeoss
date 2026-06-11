import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid, today } from "@/lib/utils";

const snapshotSchema = z.object({
  cash: z.number().default(0),
  savings: z.number().default(0),
  investments: z.number().default(0),
  debts: z.number().default(0),
  netWorth: z.number(),
  snapshotDate: z.string().optional(),
});

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("net_worth_snapshots")
    .select("*")
    .eq("user_id", auth.userId)
    .order("snapshot_date", { ascending: false })
    .limit(24);

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json({ snapshots: [], migrationRequired: "013" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    snapshots: (data ?? []).map((s) => ({
      id: s.id,
      date: s.snapshot_date,
      netWorth: s.net_worth,
      cash: s.cash,
      savings: s.savings,
      investments: s.investments,
      debts: s.debts,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const body = snapshotSchema.parse(await req.json());
  const id = uid();

  const { error } = await auth.supabase.from("net_worth_snapshots").insert({
    id,
    user_id: auth.userId,
    snapshot_date: body.snapshotDate ?? today(),
    cash: body.cash,
    savings: body.savings,
    investments: body.investments,
    debts: body.debts,
    net_worth: body.netWorth,
  });

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json({ error: "شغّل migration 013", migrationRequired: "013" }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}
