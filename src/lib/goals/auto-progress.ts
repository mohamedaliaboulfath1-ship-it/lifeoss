import type { SupabaseClient } from "@supabase/supabase-js";

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

type GoalTaskRow = {
  id: string;
  goal_id: string | null;
  status: string;
};

type GoalLinkRow = {
  id: string;
  progress: number | null;
  current_val: string | null;
  tasks?: Array<{ id: string; done?: boolean }> | null;
};

export async function recalculateGoalProgressFromTasks(
  db: SupabaseClient,
  userId: string,
  goalId: string
) {
  const [goalRes, linkedTasksRes] = await Promise.all([
    db
      .from("goals")
      .select("id, progress, current_val, tasks")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle<GoalLinkRow>(),
    db
      .from("life_tasks")
      .select("id, goal_id, status")
      .eq("user_id", userId)
      .eq("goal_id", goalId)
      .returns<GoalTaskRow[]>(),
  ]);

  if (goalRes.error || !goalRes.data) return;

  const goalEmbeddedTasks = goalRes.data.tasks ?? [];
  const embeddedIds = goalEmbeddedTasks.map((t) => t.id).filter(Boolean);
  const allLinkedIds = new Set<string>(embeddedIds);

  const relationalTasks = linkedTasksRes.data ?? [];
  for (const t of relationalTasks) allLinkedIds.add(t.id);

  const total = allLinkedIds.size;
  if (!total) return;

  let completed = 0;
  const relationalDone = new Set(
    relationalTasks.filter((t) => t.status === "done").map((t) => t.id)
  );
  for (const id of allLinkedIds) {
    if (relationalDone.has(id)) {
      completed += 1;
      continue;
    }
    const embedded = goalEmbeddedTasks.find((t) => t.id === id);
    if (embedded?.done) completed += 1;
  }

  const nextProgress = Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
  const prevProgress = toNumber(goalRes.data.progress ?? goalRes.data.current_val);
  if (nextProgress === prevProgress) return;

  await db
    .from("goals")
    .update({
      progress: nextProgress,
      current_val: String(nextProgress),
      done: nextProgress >= 100,
      status: nextProgress >= 100 ? "done" : "active",
    })
    .eq("id", goalId)
    .eq("user_id", userId);
}

