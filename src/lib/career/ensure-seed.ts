import type { SupabaseClient } from "@supabase/supabase-js";

/** Seed default career roadmap + skills into relational tables (once per user). */
export async function ensureCareerSeed(db: SupabaseClient, userId: string) {
  const { count } = await db
    .from("career_milestones")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) > 0) return;

  const milestones = [
    {
      id: "stage-accountant",
      user_id: userId,
      stage_order: 1,
      title: "محاسب",
      description: "أساسيات المحاسبة · Excel متقدم · تحليل القوائم",
      target_date: "2025-12-31",
      status: "active",
      metadata: { from: "2024-01", to: "2025-12", focus: ["أساسيات المحاسبة", "Excel متقدم", "تحليل القوائم"] },
    },
    {
      id: "stage-fa",
      user_id: userId,
      stage_order: 2,
      title: "FA",
      description: "Financial Modeling · Power BI · Budgeting",
      target_date: "2027-12-31",
      status: "planned",
      metadata: { from: "2026-01", to: "2027-12", focus: ["Financial Modeling", "Power BI", "Budgeting"] },
    },
    {
      id: "stage-senior-fa",
      user_id: userId,
      stage_order: 3,
      title: "Senior FA",
      description: "FP&A قيادة · Scenario Planning · Stakeholder Management",
      target_date: "2029-12-31",
      status: "planned",
      metadata: { from: "2028-01", to: "2029-12", focus: ["FP&A قيادة", "Scenario Planning", "Stakeholder Management"] },
    },
    {
      id: "stage-finance-manager",
      user_id: userId,
      stage_order: 4,
      title: "Finance Manager",
      description: "قيادة الفريق · الاستراتيجية المالية · حوكمة الأداء",
      target_date: "2032-12-31",
      status: "planned",
      metadata: { from: "2030-01", to: "2032-12", focus: ["قيادة الفريق", "الاستراتيجية المالية", "حوكمة الأداء"] },
    },
    {
      id: "stage-cfo",
      user_id: userId,
      stage_order: 5,
      title: "CFO",
      description: "Capital Allocation · Board Communication · M&A Readiness",
      status: "planned",
      metadata: { from: "2033-01", focus: ["Capital Allocation", "Board Communication", "M&A Readiness"] },
    },
  ];

  const skills = [
    { id: "s1", user_id: userId, name: "Excel & Modeling", category: "technical", current_level: 6, target_level: 9, metadata: { hub: "career" } },
    { id: "s2", user_id: userId, name: "FP&A", category: "analytical", current_level: 5, target_level: 9, metadata: { hub: "career" } },
    { id: "s3", user_id: userId, name: "Power BI", category: "technical", current_level: 4, target_level: 8, metadata: { hub: "career" } },
    { id: "s4", user_id: userId, name: "Presentation", category: "communication", current_level: 5, target_level: 9, metadata: { hub: "career" } },
    { id: "s5", user_id: userId, name: "People Leadership", category: "leadership", current_level: 2, target_level: 8, metadata: { hub: "career" } },
  ];

  const certs = [
    { id: "c1", user_id: userId, name: "FMVA", issuer: "CFI", status: "studying", exam_date: "2026-11-30", metadata: { hub: "career" } },
    { id: "c2", user_id: userId, name: "CFA Level 1", issuer: "CFA Institute", status: "planned", exam_date: "2027-05-15", metadata: { hub: "career" } },
  ];

  const courses = [
    { id: "cc1", user_id: userId, title: "Financial Statement Analysis", platform: "Coursera", hours_completed: 13, total_hours: 24, status: "active", metadata: { hub: "career", progress: 55 } },
    { id: "cc2", user_id: userId, title: "Advanced Excel Dashboarding", platform: "Udemy", hours_completed: 4, total_hours: 18, status: "active", metadata: { hub: "career", progress: 20 } },
  ];

  await db.from("career_milestones").upsert(milestones);
  await db.from("skills").upsert(skills);
  await db.from("certifications").upsert(certs);
  await db.from("courses").upsert(courses);

  await db.from("career_profiles").upsert({
    user_id: userId,
    current_role: "محاسب",
    target_role: "CFO",
    transformation_narrative: "محاسب → Financial Analyst → Senior FA → Finance Manager → CFO",
  });

  await db.from("mentors").upsert({
    id: "m1",
    user_id: userId,
    name: "Ahmed F.",
    expertise: "FP&A",
    meeting_frequency: "شهري",
    last_meeting_date: "2026-05-20",
  });

  await db.from("networking_contacts").upsert({
    id: "n1",
    user_id: userId,
    name: "Sara A.",
    company: "Big4",
    role_title: "Manager",
    metadata: { channel: "linkedin", lastContact: "2026-05-28", nextFollowUp: "2026-06-12" },
  });
}
