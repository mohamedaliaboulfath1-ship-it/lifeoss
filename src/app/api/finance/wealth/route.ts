import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { buildWealthSnapshot } from "@/lib/wealth/snapshot";
import { seedCategoryRows } from "@/lib/wealth/categories";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { count } = await authResult.supabase
    .from("expense_categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", authResult.userId);

  if ((count ?? 0) === 0) {
    await authResult.supabase.from("expense_categories").insert(seedCategoryRows(authResult.userId));
  }

  try {
    const snapshot = await buildWealthSnapshot(authResult.supabase, authResult.userId);
    return NextResponse.json({ snapshot });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "wealth snapshot failed";
    if (msg.includes("does not exist") || msg.includes("relation")) {
      return NextResponse.json(
        { error: "شغّل migration 013_wealth_management.sql في Supabase SQL Editor" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
