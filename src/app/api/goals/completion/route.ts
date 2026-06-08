import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { calcGoalCompletionScore } from "@/lib/goals/completion";
import { getYearForUser } from "@/lib/year-data";
import type { Goal, Habit } from "@/types/lifeos";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { data } = await getYearForUser(authResult.userId);
  const goals = (data.goals ?? []).filter((g) => g.status !== "done" && g.status !== "cancelled");
  const habits = data.habits ?? [];
  const logs = data.habitLogs ?? {};

  const { data: tasks } = await authResult.supabase
    .from("life_tasks")
    .select("goal_id, status")
    .eq("user_id", authResult.userId)
    .neq("status", "archive");

  const taskByGoal: Record<string, { done: number; total: number }> = {};
  for (const t of tasks ?? []) {
    if (!t.goal_id) continue;
    if (!taskByGoal[t.goal_id]) taskByGoal[t.goal_id] = { done: 0, total: 0 };
    taskByGoal[t.goal_id].total++;
    if (t.status === "done") taskByGoal[t.goal_id].done++;
  }

  const completions = goals.map((goal) => {
    const linkedHabits = habits.filter(
      (h) => h.goalLink === goal.id || (goal.level === "project" && h.projectId === goal.id)
    );
    const ts = taskByGoal[goal.id];
    return calcGoalCompletionScore({
      goal: goal as Goal,
      linkedHabits: linkedHabits as Habit[],
      logs,
      linkedTaskDone: ts?.done,
      linkedTaskTotal: ts?.total,
    });
  });

  return NextResponse.json({ completions });
}
