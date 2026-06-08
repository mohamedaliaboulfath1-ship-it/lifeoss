import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CareerCertification,
  CareerCourse,
  CareerProfile,
  CareerRoadmapStage,
  CareerSkillMatrixItem,
  InterviewEntry,
  JobApplication,
  MentorEntry,
  NetworkContact,
  PortfolioProject,
} from "@/types/lifeos";

function hub(row: { metadata?: Record<string, unknown> | null }) {
  return (row.metadata as Record<string, unknown> | undefined)?.hub as string | undefined;
}

function certStatus(s: string): CareerCertification["status"] {
  if (s === "passed") return "passed";
  if (s === "done") return "done";
  if (s === "studying" || s === "registered") return "studying";
  if (s === "active") return "active";
  return "planned";
}

export async function loadCareerBundle(db: SupabaseClient, userId: string) {
  const [
    profileRes,
    milestonesRes,
    skillsRes,
    certsRes,
    coursesRes,
    portfolioRes,
    jobsRes,
    interviewsRes,
    mentorsRes,
    contactsRes,
  ] = await Promise.all([
    db.from("career_profiles").select("*").eq("user_id", userId).maybeSingle(),
    db.from("career_milestones").select("*").eq("user_id", userId).order("stage_order", { ascending: true }),
    db.from("skills").select("*").eq("user_id", userId),
    db.from("certifications").select("*").eq("user_id", userId).order("exam_date", { ascending: true }),
    db.from("courses").select("*").eq("user_id", userId),
    db.from("portfolio_projects").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    db.from("job_applications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    db.from("interviews").select("*").eq("user_id", userId).order("interview_date", { ascending: false }),
    db.from("mentors").select("*").eq("user_id", userId),
    db.from("networking_contacts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  const profile: CareerProfile | null = profileRes.data
    ? {
        currentRole: profileRes.data.current_role ?? undefined,
        targetRole: profileRes.data.target_role ?? undefined,
        targetSalary: profileRes.data.target_salary ?? undefined,
        narrative: profileRes.data.transformation_narrative ?? undefined,
        targetDate: profileRes.data.target_date ?? undefined,
      }
    : null;

  const roadmap: CareerRoadmapStage[] = (milestonesRes.data ?? []).map((m) => {
    const meta = (m.metadata as Record<string, unknown> | null) ?? {};
    return {
      id: m.id,
      title: m.title,
      from: (meta.from as string) ?? undefined,
      to: (meta.to as string) ?? m.target_date ?? undefined,
      focus: Array.isArray(meta.focus) ? (meta.focus as string[]) : (m.description?.split(" · ") ?? []),
      targetDate: m.target_date ?? undefined,
      salaryRange: m.salary_range ?? (meta.salaryRange as string) ?? undefined,
      description: m.description ?? undefined,
      requirements: (meta.requirements as string[]) ?? [],
      requiredSkills: (meta.requiredSkills as string[]) ?? [],
      requiredCerts: (meta.requiredCerts as string[]) ?? [],
      requiredExperience: (meta.requiredExperience as string) ?? undefined,
      requiredProjects: (meta.requiredProjects as string[]) ?? [],
      successCriteria: (meta.successCriteria as string) ?? undefined,
      status: m.status as CareerRoadmapStage["status"],
      progressPct: m.progress_pct ?? 0,
      stageOrder: m.stage_order,
    };
  });

  const skills: CareerSkillMatrixItem[] = (skillsRes.data ?? [])
    .filter((s) => hub(s) !== "learning")
    .map((s) => {
      const ext = s as typeof s & {
        current_pct?: number;
        target_pct?: number;
        manual_score?: number;
        evidence_score?: number;
        scoring_mode?: string;
      };
      return {
        id: s.id,
        name: s.name,
        current: ext.current_pct ?? (s.current_level ?? 1) * 10,
        target: ext.target_pct ?? (s.target_level ?? 8) * 10,
        manualScore: ext.manual_score ?? ext.current_pct ?? (s.current_level ?? 1) * 10,
        evidenceScore: ext.evidence_score ?? 0,
        scoringMode: (ext.scoring_mode as CareerSkillMatrixItem["scoringMode"]) ?? "hybrid",
        category: s.category ?? "technical",
      };
    });

  const certifications: CareerCertification[] = (certsRes.data ?? [])
    .filter((c) => hub(c) !== "learning")
    .map((c) => {
      const ext = c as typeof c & {
        hours?: number;
        difficulty?: string;
        start_date?: string;
        progress_pct?: number;
        priority?: string;
        career_impact_score?: number;
      };
      return {
        id: c.id,
        name: c.name,
        provider: c.issuer ?? "",
        status: certStatus(c.status),
        dueDate: c.exam_date ?? undefined,
        startDate: ext.start_date ?? undefined,
        cost: c.cost ?? undefined,
        hours: ext.hours ?? undefined,
        difficulty: ext.difficulty ?? undefined,
        progressPct: ext.progress_pct ?? 0,
        notes: c.notes ?? undefined,
        priority: ext.priority ?? "normal",
        careerImpactScore: ext.career_impact_score ?? 50,
      };
    });

  const courses: CareerCourse[] = (coursesRes.data ?? [])
    .filter((c) => hub(c) !== "learning")
    .map((c) => {
      const meta = (c.metadata as Record<string, unknown> | null) ?? {};
      const total = c.total_hours ?? 1;
      const progress =
        typeof meta.progress === "number"
          ? meta.progress
          : Math.round(((c.hours_completed ?? 0) / total) * 100);
      return {
        id: c.id,
        title: c.title,
        platform: c.platform ?? undefined,
        progress,
        hours: total,
        status: c.status === "done" ? "done" : c.status === "active" ? "active" : "planned",
      };
    });

  const portfolio: PortfolioProject[] = (portfolioRes.data ?? []).map((p) => {
    const meta = (p.metadata as Record<string, unknown> | null) ?? {};
    const ext = p as typeof p & { outcome?: string; lessons_learned?: string; career_impact?: number; files?: unknown; links?: unknown };
    return {
      id: p.id,
      title: p.title,
      description: p.description ?? undefined,
      skillsUsed: p.skills_used ?? [],
      url: p.url ?? undefined,
      files: Array.isArray(ext.files) ? (ext.files as string[]) : [],
      links: Array.isArray(ext.links) ? (ext.links as string[]) : (meta.links as string[]) ?? [],
      outcome: ext.outcome ?? (meta.outcome as string) ?? undefined,
      lessonsLearned: ext.lessons_learned ?? (meta.lessonsLearned as string) ?? undefined,
      careerImpact: ext.career_impact ?? (meta.careerImpact as number) ?? 0,
      status: p.status as PortfolioProject["status"],
      startDate: p.start_date ?? undefined,
      finishDate: p.finish_date ?? undefined,
    };
  });

  const jobApplications: JobApplication[] = (jobsRes.data ?? []).map((j) => ({
    id: j.id,
    company: j.company,
    role: j.role_title,
    status: j.status as JobApplication["status"],
    appliedAt: j.applied_date ?? undefined,
  }));

  const interviews: InterviewEntry[] = (interviewsRes.data ?? []).map((i) => ({
    id: i.id,
    company: (i.metadata as Record<string, unknown> | null)?.company as string ?? "شركة",
    stage: i.interview_type,
    date: i.interview_date?.slice(0, 10) ?? "",
    result: (i.outcome as InterviewEntry["result"]) ?? "pending",
  }));

  const mentors: MentorEntry[] = (mentorsRes.data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    area: m.expertise ?? "",
    cadence: m.meeting_frequency ?? "",
    lastTouch: m.last_meeting_date ?? undefined,
  }));

  const networkContacts: NetworkContact[] = (contactsRes.data ?? []).map((c) => {
    const ch = ((c.metadata as Record<string, unknown> | null)?.channel as string) ?? "linkedin";
    const channel = (["linkedin", "email", "phone", "event"] as const).includes(ch as NetworkContact["channel"])
      ? (ch as NetworkContact["channel"])
      : "linkedin";
    return {
      id: c.id,
      name: c.name,
      company: c.company ?? undefined,
      role: c.role_title ?? undefined,
      channel,
      lastContact: ((c.metadata as Record<string, unknown> | null)?.lastContact as string) ?? undefined,
    };
  });

  return {
    profile,
    roadmap,
    skills,
    certifications,
    courses,
    portfolio,
    jobApplications,
    interviews,
    mentors,
    networkContacts,
  };
}
