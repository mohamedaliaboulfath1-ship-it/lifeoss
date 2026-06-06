import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";

const foodSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fats: z.number(),
  serving: z.string().optional(),
});

const mealSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  mealName: z.string().optional(),
  foodName: z.string().optional(),
  time: z.string().optional(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fats: z.number(),
});

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const type = new URL(req.url).searchParams.get("type") ?? "all";

  const [foodsRes, mealsRes] = await Promise.all([
    type === "meals"
      ? Promise.resolve({ data: [], error: null })
      : authResult.supabase.from("foods").select("*").eq("user_id", authResult.userId),
    type === "foods"
      ? Promise.resolve({ data: [], error: null })
      : authResult.supabase
          .from("meal_logs")
          .select("*")
          .eq("user_id", authResult.userId)
          .order("log_date", { ascending: false }),
  ]);

  if (foodsRes.error || mealsRes.error) {
    return NextResponse.json(
      { error: foodsRes.error?.message ?? mealsRes.error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    foods: (foodsRes.data ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fats: f.fats,
      serving: f.portion ?? undefined,
    })),
    mealLogs: (mealsRes.data ?? []).map((m) => ({
      id: m.id,
      date: m.log_date,
      mealName: m.meal_name ?? undefined,
      foodName: m.food_name ?? undefined,
      time: m.log_time ?? undefined,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fats: m.fats,
    })),
  });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const entity = body.entity as string;

  if (entity === "food") {
    const parsed = foodSchema.parse(body.payload);
    const id = parsed.id ?? uid();
    const { error } = await authResult.supabase.from("foods").upsert({
      id,
      user_id: authResult.userId,
      name: parsed.name,
      calories: parsed.calories,
      protein: parsed.protein,
      carbs: parsed.carbs,
      fats: parsed.fats,
      portion: parsed.serving ?? null,
      is_custom: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  const parsed = mealSchema.parse(body.payload);
  const id = parsed.id ?? uid();
  const { error } = await authResult.supabase.from("meal_logs").insert({
    id,
    user_id: authResult.userId,
    log_date: parsed.date,
    meal_name: parsed.mealName ?? null,
    food_name: parsed.foodName ?? null,
    log_time: parsed.time ?? null,
    calories: parsed.calories,
    protein: parsed.protein,
    carbs: parsed.carbs,
    fats: parsed.fats,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const url = new URL(req.url);
  const entity = url.searchParams.get("entity");
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  const table = entity === "food" ? "foods" : "meal_logs";
  const { error } = await authResult.supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
