import type { TimeBlock, TimeBlockStatus, TimeBlockType } from "@/types/time";

export function mapTimeBlock(row: Record<string, unknown>): TimeBlock {
  return {
    id: String(row.id),
    title: String(row.title),
    startAt: String(row.start_at),
    endAt: String(row.end_at),
    blockType: (row.block_type as TimeBlockType) ?? "task",
    status: (row.status as TimeBlockStatus) ?? "planned",
    domainId: row.domain_id as string | undefined,
    goalId: row.goal_id as string | undefined,
    projectId: row.project_id as string | undefined,
    taskId: row.task_id as string | undefined,
    habitId: row.habit_id as string | undefined,
    estimatedMinutes: row.estimated_minutes as number | undefined,
    actualMinutes: row.actual_minutes as number | undefined,
    isRecurring: Boolean(row.is_recurring),
    recurringRule: row.recurring_rule as Record<string, unknown> | undefined,
    allowDuringWork: Boolean(row.allow_during_work),
    color: row.color as string | undefined,
    notes: row.notes as string | undefined,
  };
}

export function blockToRow(userId: string, b: Partial<TimeBlock> & { id: string; title: string; startAt: string; endAt: string }) {
  return {
    id: b.id,
    user_id: userId,
    title: b.title,
    start_at: b.startAt,
    end_at: b.endAt,
    block_type: b.blockType ?? "task",
    status: b.status ?? "planned",
    domain_id: b.domainId ?? null,
    goal_id: b.goalId ?? null,
    project_id: b.projectId ?? null,
    task_id: b.taskId ?? null,
    habit_id: b.habitId ?? null,
    estimated_minutes: b.estimatedMinutes ?? null,
    actual_minutes: b.actualMinutes ?? null,
    is_recurring: b.isRecurring ?? false,
    recurring_rule: b.recurringRule ?? null,
    allow_during_work: b.allowDuringWork ?? false,
    color: b.color ?? null,
    notes: b.notes ?? null,
    updated_at: new Date().toISOString(),
  };
}
