import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { invalidateUserContext } from "@/lib/year-data";
import { runOnboardingSeed } from "@/lib/seed/run-onboarding-seed";
import {
  type PrimaryGoal,
  type WelcomeChecklist,
  parseSaasMetadata,
  defaultWelcomeChecklist,
} from "@/lib/tenant/constants";
import { shouldSkipOnboarding } from "@/lib/tenant/super-admin";

const goalSchema = z.enum([
  "career_growth",
  "fitness",
  "learning",
  "financial_freedom",
  "productivity",
  "entrepreneurship",
  "balanced_life",
]);

const postSchema = z.object({
  action: z.enum(["select_goal", "complete_onboarding", "update_checklist", "complete_tour"]),
  primaryGoal: goalSchema.optional(),
  checklist: z
    .object({
      profile: z.boolean().optional(),
      goal: z.boolean().optional(),
      habit: z.boolean().optional(),
      task: z.boolean().optional(),
      book: z.boolean().optional(),
      project: z.boolean().optional(),
      areaLink: z.boolean().optional(),
    })
    .optional(),
  tourId: z.string().optional(),
});

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("metadata, onboarded, role, tenant_id, workspace_id")
    .eq("id", auth.userId)
    .maybeSingle();

  const meta = (profile?.metadata as Record<string, unknown> | null) ?? {};
  const saas = parseSaasMetadata(meta);

  return NextResponse.json({
    skipOnboarding: shouldSkipOnboarding(auth.user.email, profile?.role),
    onboarded: profile?.onboarded ?? false,
    tenantId: profile?.tenant_id ?? auth.userId,
    workspaceId: profile?.workspace_id ?? auth.userId,
    saas,
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const body = postSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("metadata, role")
    .eq("id", auth.userId)
    .maybeSingle();

  if (shouldSkipOnboarding(auth.user.email, profile?.role)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "super_admin_protected",
    });
  }

  const prevMeta = (profile?.metadata as Record<string, unknown>) ?? {};
  const prevSaas = parseSaasMetadata(prevMeta);

  if (body.data.action === "select_goal") {
    if (!body.data.primaryGoal) {
      return NextResponse.json({ error: "اختر هدفاً رئيسياً" }, { status: 400 });
    }

    await auth.supabase.from("profiles").update({
      metadata: {
        ...prevMeta,
        saas: {
          ...prevSaas,
          primaryGoal: body.data.primaryGoal,
        },
      },
    }).eq("id", auth.userId);

    const result = await runOnboardingSeed(
      auth.supabase,
      auth.userId,
      body.data.primaryGoal as PrimaryGoal
    );

    invalidateUserContext(auth.userId);
    return NextResponse.json(result);
  }

  if (body.data.action === "complete_onboarding") {
    await auth.supabase.from("profiles").update({
      onboarded: true,
      metadata: {
        ...prevMeta,
        saas: { ...prevSaas, onboardingCompleted: true },
      },
    }).eq("id", auth.userId);

    invalidateUserContext(auth.userId);
    return NextResponse.json({ ok: true });
  }

  if (body.data.action === "update_checklist") {
    const checklist: WelcomeChecklist = {
      ...defaultWelcomeChecklist(),
      ...prevSaas.welcomeChecklist,
      ...body.data.checklist,
    };

    await auth.supabase.from("profiles").update({
      metadata: {
        ...prevMeta,
        saas: { ...prevSaas, welcomeChecklist: checklist },
      },
    }).eq("id", auth.userId);

    invalidateUserContext(auth.userId);
    return NextResponse.json({ ok: true, checklist });
  }

  if (body.data.action === "complete_tour") {
    const tourId = body.data.tourId;
    if (!tourId) {
      return NextResponse.json({ error: "معرّف الجولة مطلوب" }, { status: 400 });
    }

    const tours = new Set(prevSaas.toursCompleted ?? []);
    tours.add(tourId);

    await auth.supabase.from("profiles").update({
      metadata: {
        ...prevMeta,
        saas: { ...prevSaas, toursCompleted: [...tours] },
      },
    }).eq("id", auth.userId);

    return NextResponse.json({ ok: true, toursCompleted: [...tours] });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
