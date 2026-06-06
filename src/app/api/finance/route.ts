import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";

const txSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  type: z.enum(["income", "expense", "saving"]),
  amount: z.number().positive(),
  cat: z.string().min(1),
  note: z.string().optional(),
});

const debtSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  total: z.number().nonnegative(),
  paid: z.number().nonnegative(),
  monthlyPayment: z.number().nonnegative().optional(),
  dueDate: z.string().optional(),
});

const budgetSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1),
  monthlyLimit: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2200),
  notes: z.string().optional(),
});

const patchSchema = z.object({
  entity: z.enum(["transaction", "debt", "budget"]),
  payload: z.record(z.string(), z.unknown()),
});

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const type = new URL(req.url).searchParams.get("type");

  if (!type || type === "all") {
    const [txRes, debtRes, budgetRes] = await Promise.all([
      authResult.supabase
        .from("transactions")
        .select("*")
        .eq("user_id", authResult.userId)
        .order("tx_date", { ascending: false }),
      authResult.supabase
        .from("debts")
        .select("*")
        .eq("user_id", authResult.userId)
        .order("created_at", { ascending: false }),
      authResult.supabase
        .from("budgets")
        .select("*")
        .eq("user_id", authResult.userId)
        .order("year", { ascending: false })
        .order("month", { ascending: false }),
    ]);

    if (txRes.error || debtRes.error || budgetRes.error) {
      return NextResponse.json(
        { error: txRes.error?.message ?? debtRes.error?.message ?? budgetRes.error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transactions: (txRes.data ?? []).map((t) => ({
        id: t.id,
        date: t.tx_date,
        type: t.type === "savings" ? "saving" : t.type,
        amount: t.amount,
        cat: t.category ?? "عام",
        note: t.description ?? undefined,
      })),
      debts: (debtRes.data ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        total: d.amount,
        paid: Math.max(0, d.amount - d.remaining_amount),
        monthlyPayment: d.monthly_payment ?? undefined,
        dueDate: d.due_date ?? undefined,
      })),
      budgets: budgetRes.data ?? [],
    });
  }

  return NextResponse.json({ error: "type غير مدعوم" }, { status: 400 });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const entity = body?.entity as "transaction" | "debt" | "budget" | undefined;

  if (entity === "transaction") {
    const parsed = txSchema.parse(body.payload);
    const id = parsed.id ?? uid();
    const { error } = await authResult.supabase.from("transactions").upsert({
      id,
      user_id: authResult.userId,
      tx_date: parsed.date,
      type: parsed.type === "saving" ? "savings" : parsed.type,
      amount: parsed.amount,
      category: parsed.cat,
      description: parsed.note ?? null,
      domain_id: "domain_finance",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "debt") {
    const parsed = debtSchema.parse(body.payload);
    const id = parsed.id ?? uid();
    const remaining = Math.max(0, parsed.total - parsed.paid);
    const { error } = await authResult.supabase.from("debts").upsert({
      id,
      user_id: authResult.userId,
      name: parsed.name,
      amount: parsed.total,
      remaining_amount: remaining,
      monthly_payment: parsed.monthlyPayment ?? null,
      due_date: parsed.dueDate ?? null,
      status: remaining <= 0 ? "paid" : "active",
      domain_id: "domain_finance",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "budget") {
    const parsed = budgetSchema.parse(body.payload);
    const id = parsed.id ?? uid();
    const { error } = await authResult.supabase.from("budgets").upsert({
      id,
      user_id: authResult.userId,
      category: parsed.category,
      monthly_limit: parsed.monthlyLimit,
      month: parsed.month,
      year: parsed.year,
      notes: parsed.notes ?? null,
      domain_id: "domain_finance",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  return NextResponse.json({ error: "entity غير مدعوم" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = patchSchema.parse(await req.json());
  const entityId = String(body.payload.id ?? "");
  if (!entityId) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

  if (body.entity === "transaction") {
    const parsed = txSchema.partial().extend({ id: z.string() }).parse(body.payload);
    const updates: Record<string, unknown> = {};
    if (parsed.date !== undefined) updates.tx_date = parsed.date;
    if (parsed.type !== undefined) {
      updates.type = parsed.type === "saving" ? "savings" : parsed.type;
    }
    if (parsed.amount !== undefined) updates.amount = parsed.amount;
    if (parsed.cat !== undefined) updates.category = parsed.cat;
    if (parsed.note !== undefined) updates.description = parsed.note || null;
    const { error } = await authResult.supabase
      .from("transactions")
      .update(updates)
      .eq("id", parsed.id)
      .eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.entity === "debt") {
    const parsed = debtSchema.partial().extend({ id: z.string() }).parse(body.payload);
    const updates: Record<string, unknown> = {};
    let total = parsed.total;
    let paid = parsed.paid;
    if (total === undefined || paid === undefined) {
      const { data: current } = await authResult.supabase
        .from("debts")
        .select("amount,remaining_amount")
        .eq("id", parsed.id)
        .eq("user_id", authResult.userId)
        .maybeSingle();
      if (current) {
        total = total ?? current.amount;
        paid = paid ?? Math.max(0, current.amount - current.remaining_amount);
      }
    }

    if (parsed.name !== undefined) updates.name = parsed.name;
    if (total !== undefined) updates.amount = total;
    if (paid !== undefined && total !== undefined) {
      const remaining = Math.max(0, total - paid);
      updates.remaining_amount = remaining;
      updates.status = remaining <= 0 ? "paid" : "active";
    }
    if (parsed.monthlyPayment !== undefined) updates.monthly_payment = parsed.monthlyPayment;
    if (parsed.dueDate !== undefined) updates.due_date = parsed.dueDate || null;

    const { error } = await authResult.supabase
      .from("debts")
      .update(updates)
      .eq("id", parsed.id)
      .eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.entity === "budget") {
    const parsed = budgetSchema.partial().extend({ id: z.string() }).parse(body.payload);
    const updates: Record<string, unknown> = {};
    if (parsed.category !== undefined) updates.category = parsed.category;
    if (parsed.monthlyLimit !== undefined) updates.monthly_limit = parsed.monthlyLimit;
    if (parsed.month !== undefined) updates.month = parsed.month;
    if (parsed.year !== undefined) updates.year = parsed.year;
    if (parsed.notes !== undefined) updates.notes = parsed.notes || null;
    const { error } = await authResult.supabase
      .from("budgets")
      .update(updates)
      .eq("id", parsed.id)
      .eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "entity غير مدعوم" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const url = new URL(req.url);
  const entity = url.searchParams.get("entity");
  const id = url.searchParams.get("id");
  if (!entity || !id) {
    return NextResponse.json({ error: "entity و id مطلوبان" }, { status: 400 });
  }

  const table =
    entity === "transaction"
      ? "transactions"
      : entity === "debt"
        ? "debts"
        : entity === "budget"
          ? "budgets"
          : null;

  if (!table) return NextResponse.json({ error: "entity غير مدعوم" }, { status: 400 });

  const { error } = await authResult.supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", authResult.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
