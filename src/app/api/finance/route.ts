import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid } from "@/lib/utils";
import {
  subscriptionSchema,
  investmentSchema,
  savingsGoalSchema,
  categorySchema,
  extendedDebtSchema,
  mapSubscription,
  mapInvestment,
  mapSavingsGoal,
  mapCategory,
  mapExtendedDebt,
  type FinanceEntity,
} from "@/lib/wealth/entities-api";

const txSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  type: z.enum(["income", "expense", "saving"]),
  amount: z.number().positive(),
  cat: z.string().min(1),
  note: z.string().optional(),
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
  entity: z.enum([
    "transaction", "debt", "budget",
    "subscription", "investment", "savings_goal", "category",
  ]),
  payload: z.record(z.string(), z.unknown()),
});

const ENTITY_TABLE: Record<FinanceEntity, string> = {
  transaction: "transactions",
  debt: "debts",
  budget: "budgets",
  subscription: "subscriptions",
  investment: "investments",
  savings_goal: "savings_goals",
  category: "expense_categories",
};

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const type = new URL(req.url).searchParams.get("type");

  if (!type || type === "all") {
    const results = await Promise.all([
      authResult.supabase.from("transactions").select("*").eq("user_id", authResult.userId).order("tx_date", { ascending: false }),
      authResult.supabase.from("debts").select("*").eq("user_id", authResult.userId).order("created_at", { ascending: false }),
      authResult.supabase.from("budgets").select("*").eq("user_id", authResult.userId).order("year", { ascending: false }),
      authResult.supabase.from("subscriptions").select("*").eq("user_id", authResult.userId).order("renewal_date", { ascending: true }),
      authResult.supabase.from("investments").select("*").eq("user_id", authResult.userId).order("created_at", { ascending: false }),
      authResult.supabase.from("savings_goals").select("*").eq("user_id", authResult.userId).order("priority", { ascending: true }),
      authResult.supabase.from("expense_categories").select("*").eq("user_id", authResult.userId).order("sort_order"),
    ]);

    const err = results.find((r) => r.error);
    if (err?.error) {
      const missing = err.error.message.includes("does not exist");
      if (missing) {
        return NextResponse.json({
          transactions: [],
          debts: [],
          budgets: [],
          subscriptions: [],
          investments: [],
          savingsGoals: [],
          categories: [],
          migrationRequired: true,
        });
      }
      return NextResponse.json({ error: err.error.message }, { status: 500 });
    }

    const [txRes, debtRes, budgetRes, subRes, invRes, goalRes, catRes] = results;

    return NextResponse.json({
      transactions: (txRes.data ?? []).map((t) => ({
        id: t.id,
        date: t.tx_date,
        type: t.type === "savings" ? "saving" : t.type,
        amount: t.amount,
        cat: t.category ?? "عام",
        note: t.description ?? undefined,
      })),
      debts: (debtRes.data ?? []).map((d) => mapExtendedDebt(d)),
      budgets: budgetRes.data ?? [],
      subscriptions: (subRes.data ?? []).map((s) => mapSubscription(s)),
      investments: (invRes.data ?? []).map((i) => mapInvestment(i)),
      savingsGoals: (goalRes.data ?? []).map((g) => mapSavingsGoal(g)),
      categories: (catRes.data ?? []).map((c) => mapCategory(c)),
    });
  }

  return NextResponse.json({ error: "type غير مدعوم" }, { status: 400 });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const entity = body?.entity as FinanceEntity | undefined;
  const payload = body?.payload ?? body;

  if (entity === "transaction") {
    const parsed = txSchema.parse(payload);
    const id = parsed.id ?? uid();
    const { error } = await authResult.supabase.from("transactions").upsert({
      id, user_id: authResult.userId, tx_date: parsed.date,
      type: parsed.type === "saving" ? "savings" : parsed.type,
      amount: parsed.amount, category: parsed.cat, description: parsed.note ?? null,
      domain_id: "domain_finance",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "debt") {
    const parsed = extendedDebtSchema.parse(payload);
    const id = parsed.id ?? uid();
    const remaining = Math.max(0, parsed.total - parsed.paid);
    const { error } = await authResult.supabase.from("debts").upsert({
      id, user_id: authResult.userId, name: parsed.name, amount: parsed.total,
      remaining_amount: remaining, monthly_payment: parsed.monthlyPayment ?? null,
      due_date: parsed.dueDate ?? null, status: remaining <= 0 ? "paid" : "active",
      debt_type: parsed.debtType ?? "installment", lender: parsed.lender ?? null,
      asset_value: parsed.assetValue ?? null, start_date: parsed.startDate ?? null,
      end_date: parsed.endDate ?? null, interest_rate: parsed.interestRate ?? 0,
      total_installments: parsed.totalInstallments ?? null,
      installments_paid: parsed.installmentsPaid ?? 0, notes: parsed.notes ?? null,
      domain_id: "domain_finance",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "budget") {
    const parsed = budgetSchema.parse(payload);
    const id = parsed.id ?? uid();
    const { error } = await authResult.supabase.from("budgets").upsert({
      id, user_id: authResult.userId, category: parsed.category,
      monthly_limit: parsed.monthlyLimit, month: parsed.month, year: parsed.year,
      notes: parsed.notes ?? null, domain_id: "domain_finance",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "subscription") {
    const parsed = subscriptionSchema.parse(payload);
    const id = parsed.id ?? uid();
    const { error } = await authResult.supabase.from("subscriptions").upsert({
      id, user_id: authResult.userId, name: parsed.name, category: parsed.category ?? null,
      description: parsed.description ?? null, price: parsed.price, currency: parsed.currency,
      billing_cycle: parsed.billingCycle, renewal_date: parsed.renewalDate ?? null,
      payment_method: parsed.paymentMethod ?? null, cancellable: parsed.cancellable ?? true,
      notes: parsed.notes ?? null, active: parsed.active ?? true, domain_id: "domain_finance",
      updated_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "investment") {
    const parsed = investmentSchema.parse(payload);
    const id = parsed.id ?? uid();
    const { error } = await authResult.supabase.from("investments").upsert({
      id, user_id: authResult.userId, name: parsed.name, asset_type: parsed.assetType,
      invested_amount: parsed.investedAmount, purchase_date: parsed.purchaseDate ?? null,
      cost_basis: parsed.costBasis ?? parsed.investedAmount, current_value: parsed.currentValue,
      annual_return_pct: parsed.annualReturnPct ?? null, risk_level: parsed.riskLevel ?? null,
      notes: parsed.notes ?? null, domain_id: "domain_finance",
      updated_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "savings_goal") {
    const parsed = savingsGoalSchema.parse(payload);
    const id = parsed.id ?? uid();
    const { error } = await authResult.supabase.from("savings_goals").upsert({
      id, user_id: authResult.userId, name: parsed.name,
      goal_type: parsed.goalType ?? "custom", target_amount: parsed.targetAmount,
      current_amount: parsed.currentAmount ?? 0, monthly_contribution: parsed.monthlyContribution ?? 0,
      target_date: parsed.targetDate ?? null, priority: parsed.priority ?? 0,
      notes: parsed.notes ?? null, domain_id: "domain_finance",
      updated_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "category") {
    const parsed = categorySchema.parse(payload);
    const id = parsed.id ?? uid();
    const slug = parsed.slug ?? parsed.name.replace(/\s+/g, "-").toLowerCase();
    const { error } = await authResult.supabase.from("expense_categories").upsert({
      id, user_id: authResult.userId, name: parsed.name, slug,
      icon: parsed.icon ?? null, color: parsed.color ?? null,
      monthly_budget: parsed.monthlyBudget ?? null, sort_order: parsed.sortOrder ?? 99,
      is_system: false,
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
    if (parsed.type !== undefined) updates.type = parsed.type === "saving" ? "savings" : parsed.type;
    if (parsed.amount !== undefined) updates.amount = parsed.amount;
    if (parsed.cat !== undefined) updates.category = parsed.cat;
    if (parsed.note !== undefined) updates.description = parsed.note || null;
    const { error } = await authResult.supabase.from("transactions").update(updates).eq("id", parsed.id).eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.entity === "debt") {
    const parsed = extendedDebtSchema.partial().extend({ id: z.string() }).parse(body.payload);
    const updates: Record<string, unknown> = {};
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.total !== undefined) updates.amount = parsed.total;
    if (parsed.paid !== undefined && parsed.total !== undefined) {
      updates.remaining_amount = Math.max(0, parsed.total - parsed.paid);
      updates.status = parsed.paid >= parsed.total ? "paid" : "active";
    }
    if (parsed.monthlyPayment !== undefined) updates.monthly_payment = parsed.monthlyPayment;
    if (parsed.dueDate !== undefined) updates.due_date = parsed.dueDate || null;
    if (parsed.lender !== undefined) updates.lender = parsed.lender;
    if (parsed.interestRate !== undefined) updates.interest_rate = parsed.interestRate;
    if (parsed.totalInstallments !== undefined) updates.total_installments = parsed.totalInstallments;
    if (parsed.installmentsPaid !== undefined) updates.installments_paid = parsed.installmentsPaid;
    const { error } = await authResult.supabase.from("debts").update(updates).eq("id", parsed.id).eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.entity === "subscription") {
    const parsed = subscriptionSchema.partial().extend({ id: z.string() }).parse(body.payload);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.price !== undefined) updates.price = parsed.price;
    if (parsed.billingCycle !== undefined) updates.billing_cycle = parsed.billingCycle;
    if (parsed.renewalDate !== undefined) updates.renewal_date = parsed.renewalDate;
    if (parsed.active !== undefined) updates.active = parsed.active;
    const { error } = await authResult.supabase.from("subscriptions").update(updates).eq("id", parsed.id).eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.entity === "investment") {
    const parsed = investmentSchema.partial().extend({ id: z.string() }).parse(body.payload);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.currentValue !== undefined) updates.current_value = parsed.currentValue;
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.annualReturnPct !== undefined) updates.annual_return_pct = parsed.annualReturnPct;
    const { error } = await authResult.supabase.from("investments").update(updates).eq("id", parsed.id).eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.entity === "savings_goal") {
    const parsed = savingsGoalSchema.partial().extend({ id: z.string() }).parse(body.payload);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.currentAmount !== undefined) updates.current_amount = parsed.currentAmount;
    if (parsed.targetAmount !== undefined) updates.target_amount = parsed.targetAmount;
    if (parsed.monthlyContribution !== undefined) updates.monthly_contribution = parsed.monthlyContribution;
    const { error } = await authResult.supabase.from("savings_goals").update(updates).eq("id", parsed.id).eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.entity === "category") {
    const parsed = categorySchema.partial().extend({ id: z.string() }).parse(body.payload);
    const updates: Record<string, unknown> = {};
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.monthlyBudget !== undefined) updates.monthly_budget = parsed.monthlyBudget;
    if (parsed.icon !== undefined) updates.icon = parsed.icon;
    const { error } = await authResult.supabase.from("expense_categories").update(updates).eq("id", parsed.id).eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.entity === "budget") {
    const parsed = budgetSchema.partial().extend({ id: z.string() }).parse(body.payload);
    const updates: Record<string, unknown> = {};
    if (parsed.category !== undefined) updates.category = parsed.category;
    if (parsed.monthlyLimit !== undefined) updates.monthly_limit = parsed.monthlyLimit;
    const { error } = await authResult.supabase.from("budgets").update(updates).eq("id", parsed.id).eq("user_id", authResult.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "entity غير مدعوم" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const url = new URL(req.url);
  const entity = url.searchParams.get("entity") as FinanceEntity | null;
  const id = url.searchParams.get("id");
  if (!entity || !id) return NextResponse.json({ error: "entity و id مطلوبان" }, { status: 400 });

  const table = ENTITY_TABLE[entity];
  if (!table) return NextResponse.json({ error: "entity غير مدعوم" }, { status: 400 });

  const { error } = await authResult.supabase.from(table).delete().eq("id", id).eq("user_id", authResult.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
