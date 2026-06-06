import type { YearPayload } from "@/types/lifeos";

export function seedCareerData(payload: YearPayload): YearPayload {
  const alreadySeeded =
    (payload.careerRoadmap?.length ?? 0) > 0 ||
    (payload.careerSkillMatrix?.length ?? 0) > 0;
  if (alreadySeeded) return payload;

  return {
    ...payload,
    careerRoadmap: [
      {
        id: "stage-accountant",
        title: "محاسب",
        from: "2024-01",
        to: "2025-12",
        focus: ["أساسيات المحاسبة", "Excel متقدم", "تحليل القوائم"],
      },
      {
        id: "stage-fa",
        title: "FA",
        from: "2026-01",
        to: "2027-12",
        focus: ["Financial Modeling", "Power BI", "Budgeting"],
      },
      {
        id: "stage-senior-fa",
        title: "Senior FA",
        from: "2028-01",
        to: "2029-12",
        focus: ["FP&A قيادة", "Scenario Planning", "Stakeholder Management"],
      },
      {
        id: "stage-finance-manager",
        title: "Finance Manager",
        from: "2030-01",
        to: "2032-12",
        focus: ["قيادة الفريق", "الاستراتيجية المالية", "حوكمة الأداء"],
      },
      {
        id: "stage-cfo",
        title: "CFO",
        from: "2033-01",
        focus: ["Capital Allocation", "Board Communication", "M&A Readiness"],
      },
    ],
    careerSkillMatrix: [
      { id: "s1", name: "Excel & Modeling", current: 60, target: 90, category: "technical" },
      { id: "s2", name: "FP&A", current: 45, target: 85, category: "analytical" },
      { id: "s3", name: "Power BI", current: 40, target: 80, category: "technical" },
      { id: "s4", name: "Presentation", current: 50, target: 85, category: "communication" },
      { id: "s5", name: "People Leadership", current: 20, target: 75, category: "leadership" },
    ],
    careerCertifications: [
      { id: "c1", name: "FMVA", provider: "CFI", status: "active", dueDate: "2026-11-30" },
      { id: "c2", name: "CFA Level 1", provider: "CFA Institute", status: "planned", dueDate: "2027-05-15" },
    ],
    careerCourses: [
      { id: "cc1", title: "Financial Statement Analysis", platform: "Coursera", progress: 55, hours: 24, status: "active" },
      { id: "cc2", title: "Advanced Excel Dashboarding", platform: "Udemy", progress: 20, hours: 18, status: "active" },
    ],
    jobApplications: [],
    interviews: [],
    mentors: [
      { id: "m1", name: "Ahmed F.", area: "FP&A", cadence: "شهري", lastTouch: "2026-05-20" },
    ],
    networkContacts: [
      {
        id: "n1",
        name: "Sara A.",
        company: "Big4",
        role: "Manager",
        channel: "linkedin",
        lastContact: "2026-05-28",
        nextFollowUp: "2026-06-12",
      },
    ],
  };
}
