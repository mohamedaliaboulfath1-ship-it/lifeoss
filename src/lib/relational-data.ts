import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_RULES } from "@/lib/constants";
import type {
  Book,
  CareerCertification,
  CareerCourse,
  CareerRoadmapStage,
  CareerSkillMatrixItem,
  Debt,
  DailyJournal,
  Exercise,
  Food,
  IdentityData,
  InterviewEntry,
  JobApplication,
  KnowledgeArea,
  LifeTask,
  MealLog,
  Measurement,
  MentorEntry,
  NetworkContact,
  PeriodReview,
  StudySession,
  Transaction,
  WorkoutSetLog,
} from "@/types/lifeos";

type Db = SupabaseClient;

async function safeSelect<T>(
  promise: PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<T | null> {
  const { data, error } = await promise;
  if (error) {
    if (!error.message.includes("does not exist")) {
      console.warn("relational-data:", error.message);
    }
    return null;
  }
  return data;
}

function hub(row: { metadata?: Record<string, unknown> | null }) {
  return (row.metadata as Record<string, unknown> | undefined)?.hub as string | undefined;
}

function certStatus(s: string): CareerCertification["status"] {
  if (s === "passed" || s === "done") return "done";
  if (s === "studying" || s === "registered" || s === "active") return "active";
  return "planned";
}

function courseStatus(s: string): CareerCourse["status"] {
  if (s === "done") return "done";
  if (s === "active") return "active";
  return "planned";
}

export async function loadIdentity(db: Db, userId: string): Promise<IdentityData> {
  const { data } = await db.from("profiles").select("metadata").eq("id", userId).maybeSingle();
  const meta = (data?.metadata as Record<string, unknown> | null) ?? {};
  const identity = (meta.identity as Partial<IdentityData> | undefined) ?? {};
  return {
    traits: identity.traits ?? [],
    rules: identity.rules?.length ? identity.rules : [...DEFAULT_RULES],
  };
}

export async function loadRelationalYearData(db: Db, userId: string) {
  const [
    tasks,
    books,
    readingLogs,
    transactions,
    debts,
    foods,
    mealLogs,
    exercises,
    measureLogs,
    workoutLogs,
    dailyJournals,
    weeklyReviews,
    monthlyReviews,
    periodReviews,
    careerMilestones,
    skills,
    certifications,
    courses,
    jobApplications,
    interviews,
    mentors,
    networkContacts,
    learningPathsRows,
    studySessionsRows,
    knowledgeAreasRows,
  ] = await Promise.all([
    safeSelect(
      db.from("life_tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    ),
    safeSelect(
      db.from("books").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    ),
    safeSelect(
      db.from("reading_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false })
    ),
    safeSelect(
      db.from("transactions").select("*").eq("user_id", userId).order("tx_date", { ascending: false })
    ),
    safeSelect(db.from("debts").select("*").eq("user_id", userId)),
    safeSelect(db.from("foods").select("*").eq("user_id", userId)),
    safeSelect(
      db.from("meal_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false })
    ),
    safeSelect(db.from("exercises").select("*").eq("user_id", userId)),
    safeSelect(
      db.from("body_measurements").select("*").eq("user_id", userId).order("measure_date", { ascending: true })
    ),
    safeSelect(
      db.from("workout_set_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false })
    ),
    safeSelect(
      db.from("daily_journals").select("*").eq("user_id", userId).order("journal_date", { ascending: false })
    ),
    safeSelect(
      db.from("weekly_reviews").select("*").eq("user_id", userId).order("review_date", { ascending: false })
    ),
    safeSelect(
      db.from("monthly_reviews").select("*").eq("user_id", userId).order("review_date", { ascending: false })
    ),
    safeSelect(
      db.from("period_reviews").select("*").eq("user_id", userId).order("review_date", { ascending: false })
    ),
    safeSelect(
      db.from("career_milestones").select("*").eq("user_id", userId).order("stage_order", { ascending: true })
    ),
    safeSelect(db.from("skills").select("*").eq("user_id", userId)),
    safeSelect(db.from("certifications").select("*").eq("user_id", userId)),
    safeSelect(db.from("courses").select("*").eq("user_id", userId)),
    safeSelect(
      db.from("job_applications").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    ),
    safeSelect(
      db.from("interviews").select("*").eq("user_id", userId).order("interview_date", { ascending: false })
    ),
    safeSelect(db.from("mentors").select("*").eq("user_id", userId)),
    safeSelect(
      db.from("networking_contacts").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    ),
    safeSelect(
      db.from("learning_paths").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    ),
    safeSelect(
      db.from("study_sessions").select("*").eq("user_id", userId).order("session_date", { ascending: false })
    ),
    safeSelect(db.from("knowledge_areas").select("*").eq("user_id", userId)),
  ]);

  const mappedTasks: LifeTask[] = (tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    goalId: t.goal_id ?? undefined,
    status: t.status,
    priority: t.priority,
    dueDate: t.due_date ?? undefined,
    estimatedTime: t.estimated_time ?? undefined,
    completedDate: t.completed_date ?? undefined,
    note: t.notes ?? undefined,
  }));

  const mappedBooks: Book[] = (books ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author ?? undefined,
    field: b.category ?? undefined,
    pages: b.pages_total ?? undefined,
    curPage: b.pages_read ?? 0,
    priority: b.priority,
    status: b.status,
    notes: b.notes ?? undefined,
  }));

  const mappedReadingSessions = (readingLogs ?? []).map((r) => ({
    id: r.id,
    date: r.log_date,
    bookId: r.book_id,
    pages: r.pages,
    durationMin: r.duration_min ?? 0,
  }));

  const careerRoadmap: CareerRoadmapStage[] = (careerMilestones ?? []).map((m) => {
    const meta = (m.metadata as Record<string, unknown> | null) ?? {};
    const focus = Array.isArray(meta.focus) ? (meta.focus as string[]) : [];
    return {
      id: m.id,
      title: m.title,
      from: (meta.from as string) ?? undefined,
      to: (meta.to as string) ?? m.target_date ?? undefined,
      focus: focus.length ? focus : (m.description?.split(" · ") ?? []),
    };
  });

  const careerSkills: CareerSkillMatrixItem[] = (skills ?? [])
    .filter((s) => hub(s) !== "learning")
    .map((s) => ({
      id: s.id,
      name: s.name,
      current: (s.current_level ?? 1) * 10,
      target: (s.target_level ?? 5) * 10,
      category: (s.category as CareerSkillMatrixItem["category"]) ?? "technical",
    }));

  const allCerts = certifications ?? [];
  const careerCertifications: CareerCertification[] = allCerts
    .filter((c) => hub(c) !== "learning")
    .map((c) => ({
      id: c.id,
      name: c.name,
      provider: c.issuer ?? "",
      status: certStatus(c.status),
      dueDate: c.exam_date ?? undefined,
    }));

  const allCourses = courses ?? [];
  const careerCourses: CareerCourse[] = allCourses
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
        status: courseStatus(c.status),
      };
    });

  const jobApps: JobApplication[] = (jobApplications ?? []).map((j) => ({
    id: j.id,
    company: j.company,
    role: j.role_title,
    status: j.status as JobApplication["status"],
    appliedAt: j.applied_date ?? undefined,
  }));

  const interviewEntries: InterviewEntry[] = (interviews ?? []).map((i) => ({
    id: i.id,
    company: (i.metadata as Record<string, unknown> | null)?.company as string ?? "شركة",
    stage: i.interview_type,
    date: i.interview_date?.slice(0, 10) ?? "",
    result: (i.outcome as InterviewEntry["result"]) ?? "pending",
  }));

  const mentorEntries: MentorEntry[] = (mentors ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    area: m.expertise ?? "",
    cadence: m.meeting_frequency ?? "",
    lastTouch: m.last_meeting_date ?? undefined,
  }));

  const contacts: NetworkContact[] = (networkContacts ?? []).map((c) => {
    const meta = (c.metadata as Record<string, unknown> | null) ?? {};
    return {
      id: c.id,
      name: c.name,
      company: c.company ?? undefined,
      role: c.role_title ?? undefined,
      channel: (meta.channel as NetworkContact["channel"]) ?? "linkedin",
      lastContact: (meta.lastContact as string) ?? c.last_contact_date ?? undefined,
      nextFollowUp: meta.nextFollowUp as string | undefined,
    };
  });

  const learningPaths = (learningPathsRows ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    progress: p.progress,
    targetDate: p.target_date ?? undefined,
  }));

  const learningCourses: CareerCourse[] = allCourses
    .filter((c) => hub(c) === "learning")
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
        status: courseStatus(c.status),
      };
    });

  const learningCertifications: CareerCertification[] = allCerts
    .filter((c) => hub(c) === "learning")
    .map((c) => ({
      id: c.id,
      name: c.name,
      provider: c.issuer ?? "",
      status: certStatus(c.status),
      dueDate: c.exam_date ?? undefined,
    }));

  const studySessions: StudySession[] = (studySessionsRows ?? []).map((s) => ({
    id: s.id,
    topic: s.topic,
    date: s.session_date,
    durationMin: s.duration_min,
    focus: s.focus_score ?? 5,
  }));

  const knowledgeAreas: KnowledgeArea[] = (knowledgeAreasRows ?? []).map((k) => ({
    id: k.id,
    name: k.name,
    progress: k.progress,
    target: k.target,
  }));

  const reviews: PeriodReview[] = [
    ...(weeklyReviews ?? []).map((w) => ({
      id: w.id,
      period: w.review_date?.slice(0, 7) ?? "",
      type: "weekly" as const,
      wins: w.wins ?? undefined,
      challenges: w.failures ?? undefined,
      lessons: w.biggest_lesson ?? undefined,
      nextFocus: w.next_week_focus ?? undefined,
    })),
    ...(monthlyReviews ?? []).map((m) => ({
      id: m.id,
      period: m.month_name ?? m.review_date?.slice(0, 7) ?? "",
      type: "monthly" as const,
      wins: m.top_wins ?? undefined,
      challenges: m.stop_doing ?? undefined,
      lessons: m.lessons ?? undefined,
      nextFocus: m.next_focus ?? undefined,
    })),
    ...(periodReviews ?? []).map((p) => ({
      id: p.id,
      period: p.review_date?.slice(0, 7) ?? "",
      type: p.period as "quarterly" | "annual",
      wins: p.wins ?? undefined,
      challenges: p.challenges ?? undefined,
      lessons: p.lessons ?? undefined,
      nextFocus: p.next_focus ?? undefined,
    })),
  ];

  return {
    tasks: mappedTasks,
    books: mappedBooks,
    readingSessions: mappedReadingSessions,
    transactions: (transactions ?? []).map(
      (t): Transaction => ({
        id: t.id,
        date: t.tx_date,
        type: t.type === "savings" ? "saving" : t.type,
        amount: t.amount,
        cat: t.category ?? "",
        note: t.description ?? undefined,
      })
    ),
    debts: (debts ?? []).map(
      (d): Debt => ({
        id: d.id,
        name: d.name,
        total: d.amount,
        paid: d.amount - d.remaining_amount,
        monthlyPayment: d.monthly_payment ?? undefined,
        dueDate: d.due_date ?? undefined,
      })
    ),
    foods: (foods ?? []).map(
      (f): Food => ({
        id: f.id,
        name: f.name,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fats: f.fats,
        serving: f.portion ?? undefined,
      })
    ),
    mealLogs: (mealLogs ?? []).map(
      (m): MealLog => ({
        id: m.id,
        date: m.log_date,
        mealName: m.meal_name ?? undefined,
        foodName: m.food_name ?? undefined,
        time: m.log_time ?? undefined,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fats: m.fats,
      })
    ),
    exercises: (exercises ?? []).map(
      (e): Exercise => ({
        id: e.id,
        name: e.name,
        muscleGroup: e.muscle_group ?? undefined,
        equipment: e.equipment ?? undefined,
      })
    ),
    measureLogs: (measureLogs ?? []).map(
      (m): Measurement => ({
        id: m.id,
        date: m.measure_date,
        chest: m.chest ?? undefined,
        arm: m.arm ?? undefined,
        waist: m.waist ?? undefined,
        thigh: m.thigh ?? undefined,
        note: m.notes ?? undefined,
      })
    ),
    workoutLogs: (workoutLogs ?? []).map(
      (w): WorkoutSetLog => ({
        id: w.id,
        date: w.log_date,
        exerciseId: w.exercise_id ?? undefined,
        weight: w.weight ?? undefined,
        reps: w.reps ?? undefined,
        sets: w.sets ?? undefined,
        rpe: w.rpe ?? undefined,
        notes: w.notes ?? undefined,
      })
    ),
    dailyJournals: (dailyJournals ?? []).map(
      (j): DailyJournal => ({
        id: j.id,
        date: j.journal_date,
        mood: j.mood_score ?? undefined,
        energy: (j.metadata as Record<string, unknown> | null)?.energy as number | undefined,
        note: j.notes ?? j.wins ?? undefined,
      })
    ),
    reviews,
    careerRoadmap,
    careerSkillMatrix: careerSkills,
    careerCertifications,
    careerCourses,
    jobApplications: jobApps,
    interviews: interviewEntries,
    mentors: mentorEntries,
    networkContacts: contacts,
    learningPaths,
    learningCourses,
    learningCertifications,
    studySessions,
    knowledgeAreas,
  };
}
