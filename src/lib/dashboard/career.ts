import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardCareerSummary } from "@/types/lifeos-pro";
import { getWeekDates } from "@/lib/utils";

export async function loadCareerSummary(
  db: SupabaseClient,
  userId: string
): Promise<DashboardCareerSummary> {
  const weekStart = getWeekDates(0)[0];

  const [profileRes, skillsRes, certsRes, readingRes, coursesRes, goalsRes] =
    await Promise.all([
      db.from("career_profiles").select("*").eq("user_id", userId).maybeSingle(),
      db.from("skills").select("id, name, current_level, target_level, hours_practiced").eq("user_id", userId).limit(8),
      db.from("certifications").select("id, name, status, issuer").eq("user_id", userId).limit(6),
      db.from("reading_logs").select("duration_min, log_date").eq("user_id", userId).gte("log_date", weekStart),
      db.from("courses").select("hours_completed, status").eq("user_id", userId).eq("status", "active"),
      db
        .from("goals")
        .select("title, progress, category, area, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .or("category.eq.career,area.eq.career"),
    ]);

  const readingMins = (readingRes.data ?? []).reduce(
    (s, r) => s + (r.duration_min ?? 0),
    0
  );
  const courseHours = (coursesRes.data ?? []).reduce(
    (s, c) => s + (c.hours_completed ?? 0),
    0
  );
  const learningHoursWeek = Math.round((readingMins / 60 + courseHours) * 10) / 10;

  const careerGoals = goalsRes.data ?? [];
  const faGoal = careerGoals.find((g) =>
    g.title?.toLowerCase().includes("analyst") ||
    g.title?.includes("محلل")
  );

  const profile = profileRes.data;

  return {
    currentRole: profile?.current_role ?? "محاسب",
    targetRole: profile?.target_role ?? "Financial Analyst",
    transformationProgress: faGoal?.progress ?? careerGoals[0]?.progress ?? 0,
    primaryGoalTitle: faGoal?.title ?? careerGoals[0]?.title,
    skills: (skillsRes.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      level: s.current_level,
      target: s.target_level,
      hours: s.hours_practiced,
    })),
    certifications: (certsRes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      issuer: c.issuer ?? undefined,
    })),
    learningHoursWeek,
    learningHoursTarget: 5,
  };
}
