import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { loadCareerBundle } from "@/lib/career/load-career-data";
import { calcCareerReadiness } from "@/lib/career/readiness";
import { buildCareerCoachInsights } from "@/lib/career/coach";
import { enrichSkillScores } from "@/lib/career/skill-engine";
import { buildCareerIntegrations } from "@/lib/career/integration";
import { getWeekDates, uid, today } from "@/lib/utils";

const entityEnum = z.enum([
  "career_profile",
  "milestone",
  "skill",
  "certification",
  "course",
  "portfolio",
  "job_application",
  "interview",
  "mentor",
  "network_contact",
]);

const postSchema = z.object({
  entity: entityEnum,
  payload: z.record(z.string(), z.unknown()),
});

const patchSchema = z.object({
  entity: entityEnum,
  id: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

const deleteSchema = z.object({
  entity: entityEnum,
  id: z.string(),
});

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { supabase, userId } = authResult;
  const bundle = await loadCareerBundle(supabase, userId);

  const [goalsRes, habitsRes, booksRes, readingRes] = await Promise.all([
    supabase.from("goals").select("id, title, progress, area, category, status").eq("user_id", userId).eq("status", "active"),
    supabase.from("habits").select("id, name, cat, goal_id").eq("user_id", userId).eq("active", true),
    supabase.from("books").select("id, title, progress, category").eq("user_id", userId),
    supabase.from("reading_logs").select("duration_min, log_date").eq("user_id", userId).gte("log_date", getWeekDates(0)[0]),
  ]);

  const goals = (goalsRes.data ?? []).map((g) => ({
    id: g.id,
    title: g.title,
    area: g.area ?? g.category,
    category: g.category,
    progress: g.progress ?? 0,
    priority: "med" as const,
  }));
  const habits = (habitsRes.data ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    cat: h.cat ?? "",
    goalLink: h.goal_id ?? undefined,
  }));
  const books = (booksRes.data ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    progress: b.progress ?? 0,
    category: b.category ?? undefined,
  }));

  const activeStage =
    bundle.roadmap.find((r) => r.status === "active") ?? bundle.roadmap[0] ?? null;
  const integrations = buildCareerIntegrations({ activeStage, goals, habits, books });

  const enrichedSkills = enrichSkillScores(bundle.skills, {
    certs: bundle.certifications,
    projects: bundle.portfolio,
  });

  const readingMins = (readingRes.data ?? []).reduce((s, r) => s + (r.duration_min ?? 0), 0);
  const learningHoursWeek = Math.round((readingMins / 60) * 10) / 10;
  const careerGoalProgress =
    goals.filter((g) => g.area === "career" || g.category === "career").length > 0
      ? Math.round(
          goals
            .filter((g) => g.area === "career" || g.category === "career")
            .reduce((s, g) => s + (g.progress ?? 0), 0) /
            goals.filter((g) => g.area === "career" || g.category === "career").length
        )
      : 0;

  const readiness = calcCareerReadiness({
    skills: enrichedSkills,
    certs: bundle.certifications,
    projects: bundle.portfolio,
    roadmap: bundle.roadmap,
    learningHoursWeek,
    goalProgress: careerGoalProgress,
  });

  const careerHabitCount = habits.filter((h) => h.cat === "career" || h.goalLink).length;
  const habitBonus = careerHabitCount > 0 ? Math.min(15, careerHabitCount * 3) : 0;
  const unifiedScore = Math.min(100, readiness.score + habitBonus);

  const insights = [
    ...buildCareerCoachInsights({
      readiness,
      skills: enrichedSkills,
      certs: bundle.certifications,
      roadmap: bundle.roadmap,
      targetRole: bundle.profile?.targetRole,
    }),
    ...integrations.suggestions.map((s) => ({
      id: s.id,
      icon: s.icon,
      message: s.label,
      action: s.reason,
      actionUrl: s.actionUrl ?? "/career",
      priority: "normal" as const,
    })),
  ].slice(0, 8);

  return NextResponse.json({
    ...bundle,
    skills: enrichedSkills,
    readiness,
    insights,
    integrations,
    unifiedScore,
  });
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { entity, payload } = postSchema.parse(await req.json());
  const id = (payload.id as string) ?? uid();
  const { supabase, userId } = authResult;

  if (entity === "career_profile") {
    const { error } = await supabase.from("career_profiles").upsert({
      user_id: userId,
      current_role: payload.currentRole ?? null,
      target_role: payload.targetRole ?? null,
      target_salary: payload.targetSalary ?? null,
      transformation_narrative: payload.narrative ?? null,
      target_date: payload.targetDate ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (entity === "milestone") {
    const meta = {
      from: payload.from,
      to: payload.to,
      focus: payload.focus ?? [],
      requirements: payload.requirements ?? [],
      requiredSkills: payload.requiredSkills ?? [],
      requiredCerts: payload.requiredCerts ?? [],
      requiredExperience: payload.requiredExperience,
      requiredProjects: payload.requiredProjects ?? [],
      successCriteria: payload.successCriteria,
    };
    const { error } = await supabase.from("career_milestones").insert({
      id,
      user_id: userId,
      stage_order: (payload.stageOrder as number) ?? 0,
      title: String(payload.title ?? ""),
      description: (payload.description as string) ?? (payload.focus as string[])?.join(" · ") ?? null,
      target_date: payload.targetDate ?? null,
      salary_range: payload.salaryRange ?? null,
      status: (payload.status as string) ?? "planned",
      progress_pct: (payload.progressPct as number) ?? 0,
      metadata: meta,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "skill") {
    const { error } = await supabase.from("skills").insert({
      id,
      user_id: userId,
      name: String(payload.name ?? ""),
      category: (payload.category as string) ?? "technical",
      current_level: Math.ceil(((payload.current as number) ?? 0) / 10) || 1,
      target_level: Math.ceil(((payload.target as number) ?? 80) / 10) || 8,
      current_pct: (payload.current as number) ?? 0,
      target_pct: (payload.target as number) ?? 80,
      manual_score: (payload.manualScore as number) ?? (payload.current as number) ?? 0,
      evidence_score: (payload.evidenceScore as number) ?? 0,
      scoring_mode: (payload.scoringMode as string) ?? "hybrid",
      metadata: { hub: "career" },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "certification") {
    const { error } = await supabase.from("certifications").insert({
      id,
      user_id: userId,
      name: String(payload.name ?? ""),
      issuer: (payload.provider as string) ?? null,
      status: mapCertStatus(payload.status as string),
      exam_date: payload.dueDate ?? null,
      start_date: payload.startDate ?? null,
      cost: payload.cost ?? null,
      hours: payload.hours ?? null,
      difficulty: payload.difficulty ?? null,
      progress_pct: (payload.progressPct as number) ?? 0,
      priority: (payload.priority as string) ?? "normal",
      career_impact_score: (payload.careerImpactScore as number) ?? 50,
      notes: (payload.notes as string) ?? null,
      metadata: { hub: "career" },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "course") {
    const { error } = await supabase.from("courses").insert({
      id,
      user_id: userId,
      title: String(payload.title ?? ""),
      platform: (payload.platform as string) ?? null,
      total_hours: (payload.hours as number) ?? null,
      hours_completed: Math.round(((payload.progress as number) ?? 0) / 100 * ((payload.hours as number) ?? 10)),
      status: (payload.status as string) ?? "planned",
      metadata: { hub: "career", progress: payload.progress ?? 0 },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "portfolio") {
    const { error } = await supabase.from("portfolio_projects").insert({
      id,
      user_id: userId,
      title: String(payload.title ?? ""),
      description: (payload.description as string) ?? null,
      skills_used: (payload.skillsUsed as string[]) ?? [],
      url: (payload.url as string) ?? null,
      status: (payload.status as string) ?? "planned",
      start_date: payload.startDate ?? null,
      finish_date: payload.finishDate ?? null,
      outcome: (payload.outcome as string) ?? null,
      lessons_learned: (payload.lessonsLearned as string) ?? null,
      career_impact: (payload.careerImpact as number) ?? 0,
      files: (payload.files as string[]) ?? [],
      links: (payload.links as string[]) ?? [],
      metadata: {},
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "job_application") {
    const { error } = await supabase.from("job_applications").insert({
      id,
      user_id: userId,
      company: String(payload.company ?? ""),
      role_title: String(payload.role ?? ""),
      status: (payload.status as string) ?? "applied",
      applied_date: (payload.appliedAt as string) ?? today(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "interview") {
    const date = (payload.date as string) ?? today();
    const { error } = await supabase.from("interviews").insert({
      id,
      user_id: userId,
      interview_date: `${date}T12:00:00Z`,
      interview_type: (payload.stage as string) ?? "technical",
      outcome: (payload.result as string) ?? "pending",
      metadata: { company: payload.company ?? "شركة" },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "mentor") {
    const { error } = await supabase.from("mentors").insert({
      id,
      user_id: userId,
      name: String(payload.name ?? ""),
      expertise: (payload.area as string) ?? null,
      meeting_frequency: (payload.cadence as string) ?? null,
      last_meeting_date: (payload.lastTouch as string) ?? today(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  const { error } = await supabase.from("networking_contacts").insert({
    id,
    user_id: userId,
    name: String(payload.name ?? ""),
    company: (payload.company as string) ?? null,
    role_title: (payload.role as string) ?? null,
    metadata: {
      channel: payload.channel ?? "linkedin",
      lastContact: payload.lastContact ?? today(),
    },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const raw = await req.json();
  const { supabase, userId } = authResult;

  if (raw.action === "reorder_milestones" && Array.isArray(raw.order)) {
    for (let i = 0; i < raw.order.length; i++) {
      await supabase
        .from("career_milestones")
        .update({ stage_order: i + 1 })
        .eq("id", raw.order[i])
        .eq("user_id", userId);
    }
    return NextResponse.json({ ok: true });
  }

  const { entity, id, payload } = patchSchema.parse(raw);

  if (entity === "milestone") {
    const updates: Record<string, unknown> = {};
    if (payload.title) updates.title = payload.title;
    if (payload.targetDate !== undefined) updates.target_date = payload.targetDate;
    if (payload.salaryRange !== undefined) updates.salary_range = payload.salaryRange;
    if (payload.status) updates.status = payload.status;
    if (payload.progressPct !== undefined) updates.progress_pct = payload.progressPct;
    if (payload.description) updates.description = payload.description;
    if (payload.stageOrder !== undefined) updates.stage_order = payload.stageOrder;
    const { error } = await supabase.from("career_milestones").update(updates).eq("id", id).eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (entity === "skill") {
    const updates: Record<string, unknown> = {};
    if (payload.name) updates.name = payload.name;
    if (payload.current !== undefined) {
      updates.current_pct = payload.current;
      updates.manual_score = payload.manualScore ?? payload.current;
      updates.current_level = Math.ceil((payload.current as number) / 10) || 1;
    }
    if (payload.target !== undefined) {
      updates.target_pct = payload.target;
      updates.target_level = Math.ceil((payload.target as number) / 10) || 8;
    }
    if (payload.scoringMode) updates.scoring_mode = payload.scoringMode;
    const { error } = await supabase.from("skills").update(updates).eq("id", id).eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (entity === "certification") {
    const updates: Record<string, unknown> = {};
    if (payload.name) updates.name = payload.name;
    if (payload.status) updates.status = mapCertStatus(payload.status as string);
    if (payload.progressPct !== undefined) updates.progress_pct = payload.progressPct;
    if (payload.dueDate !== undefined) updates.exam_date = payload.dueDate;
    const { error } = await supabase.from("certifications").update(updates).eq("id", id).eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (entity === "portfolio") {
    const updates: Record<string, unknown> = {};
    if (payload.title) updates.title = payload.title;
    if (payload.status) updates.status = payload.status;
    if (payload.careerImpact !== undefined) updates.career_impact = payload.careerImpact;
    const { error } = await supabase.from("portfolio_projects").update(updates).eq("id", id).eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (entity === "job_application") {
    const updates: Record<string, unknown> = {};
    if (payload.status) updates.status = payload.status;
    if (payload.company) updates.company = payload.company;
    if (payload.role) updates.role_title = payload.role;
    const { error } = await supabase.from("job_applications").update(updates).eq("id", id).eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "PATCH غير مدعوم لهذا النوع" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { entity, id } = deleteSchema.parse(await req.json());
  const { supabase, userId } = authResult;

  const tableMap: Record<string, string> = {
    milestone: "career_milestones",
    skill: "skills",
    certification: "certifications",
    course: "courses",
    portfolio: "portfolio_projects",
    job_application: "job_applications",
    interview: "interviews",
    mentor: "mentors",
    network_contact: "networking_contacts",
  };

  const table = tableMap[entity];
  if (!table) return NextResponse.json({ error: "نوع غير مدعوم" }, { status: 400 });

  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

function mapCertStatus(s?: string) {
  if (s === "done" || s === "passed") return "passed";
  if (s === "active" || s === "studying") return "studying";
  return s ?? "planned";
}
