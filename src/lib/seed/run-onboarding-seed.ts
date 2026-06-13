import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ONBOARDING_MARKER_GOAL,
  ONBOARDING_SEED_TAG,
  type PrimaryGoal,
  parseSaasMetadata,
} from "@/lib/tenant/constants";
import { shouldSkipOnboarding } from "@/lib/tenant/super-admin";
import { buildOnboardingPayload } from "./onboarding-templates";

async function upsertRows(db: SupabaseClient, table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
}

export async function isOnboardingSeeded(db: SupabaseClient, userId: string) {
  const { data: profile } = await db
    .from("profiles")
    .select("metadata")
    .eq("id", userId)
    .maybeSingle();

  const saas = parseSaasMetadata(
    (profile?.metadata as Record<string, unknown> | null) ?? {}
  );
  if (saas.demoSeeded) return true;

  const { data: goal } = await db
    .from("goals")
    .select("id")
    .eq("user_id", userId)
    .eq("id", ONBOARDING_MARKER_GOAL)
    .maybeSingle();

  return Boolean(goal);
}

export async function runOnboardingSeed(
  db: SupabaseClient,
  userId: string,
  primaryGoal: PrimaryGoal,
  options?: { force?: boolean }
) {
  if (await isOnboardingSeeded(db, userId) && !options?.force) {
    return { ok: true as const, alreadySeeded: true };
  }

  const payload = buildOnboardingPayload(userId, primaryGoal);

  await upsertRows(db, "goals", payload.goals);
  await upsertRows(db, "habits", payload.habits);
  await upsertRows(db, "life_tasks", payload.tasks);
  if (payload.books.length) await upsertRows(db, "books", payload.books);
  if (payload.skills.length) await upsertRows(db, "skills", payload.skills);
  if (payload.learningPaths.length) await upsertRows(db, "learning_paths", payload.learningPaths);
  if (payload.savingsGoals.length) await upsertRows(db, "savings_goals", payload.savingsGoals);

  const { data: existing } = await db
    .from("profiles")
    .select("metadata")
    .eq("id", userId)
    .maybeSingle();

  const prevMeta = (existing?.metadata as Record<string, unknown>) ?? {};
  const prevSaas = parseSaasMetadata(prevMeta);

  const profileUpdate: Record<string, unknown> = {
    id: userId,
    onboarded: true,
    metadata: {
      ...prevMeta,
      saas: {
        ...prevSaas,
        plan: prevSaas.plan ?? "free",
        primaryGoal,
        onboardingCompleted: true,
        demoSeeded: true,
        welcomeChecklist: prevSaas.welcomeChecklist,
        toursCompleted: prevSaas.toursCompleted ?? [],
      },
      onboardingSeedTag: ONBOARDING_SEED_TAG,
    },
    ...payload.profilePatches,
  };

  const { error: pErr } = await db.from("profiles").upsert(profileUpdate);
  if (pErr) throw new Error(`profiles: ${pErr.message}`);

  return { ok: true as const, seeded: true, primaryGoal };
}

export async function maybeSeedOnboarding(
  db: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  role?: string
) {
  if (shouldSkipOnboarding(email, role)) {
    return { skipped: true as const, reason: "super_admin" as const };
  }

  const { data: profile } = await db
    .from("profiles")
    .select("metadata, onboarded, role")
    .eq("id", userId)
    .maybeSingle();

  const saas = parseSaasMetadata(
    (profile?.metadata as Record<string, unknown> | null) ?? {}
  );

  if (saas.demoSeeded || profile?.onboarded) {
    return { skipped: true as const, reason: "already_onboarded" as const };
  }

  if (!saas.primaryGoal) {
    return { skipped: true as const, reason: "awaiting_goal_selection" as const };
  }

  return runOnboardingSeed(db, userId, saas.primaryGoal);
}
