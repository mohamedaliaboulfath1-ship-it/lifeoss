import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getUserContext } from "@/lib/year-data";

function errorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  return "فشل تحميل البيانات";
}

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  try {
    const ctx = await getUserContext(authResult.userId);
    return NextResponse.json(ctx);
  } catch (e) {
    console.error("GET /api/data:", e);
    return NextResponse.json(
      { error: errorMessage(e) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.profile) {
    const p = body.profile;
    if (p.displayName !== undefined) updates.display_name = p.displayName;
    if (p.name !== undefined) updates.display_name = p.name;
    if (p.city !== undefined) updates.city = p.city;
    if (p.age !== undefined) updates.age = p.age;
    if (p.height !== undefined) updates.height = p.height;
    if (p.startWeight !== undefined) updates.start_weight = p.startWeight;
    if (p.targetWeight !== undefined) updates.target_weight = p.targetWeight;
    if (p.salary !== undefined) updates.salary = p.salary;
    if (p.targetSalary !== undefined) updates.target_salary = p.targetSalary;
    if (p.startDate !== undefined) updates.start_date = p.startDate;
    if (p.onboarded !== undefined) updates.onboarded = p.onboarded;
  }

  if (body.currentYear) {
    updates.current_year = String(body.currentYear);
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await authResult.supabase
      .from("profiles")
      .update(updates)
      .eq("id", authResult.userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  try {
    const ctx = await getUserContext(authResult.userId);
    return NextResponse.json(ctx);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل تحديث البيانات" }, { status: 500 });
  }
}
