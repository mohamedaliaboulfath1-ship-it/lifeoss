import type { DbClient } from "@/domains/core/repository";
import { GoalEntity, type GoalProps } from "@/domains/goals/entities/goal.entity";

const GOAL_COLS =
  "id, title, area, category, priority, progress, status, level, parent_id, target_date, due_date, domain_id, habit_contribution_pct, task_contribution_pct, progress_contribution_pct";

function mapRow(row: Record<string, unknown>): GoalProps {
  return {
    id: String(row.id),
    title: String(row.title),
    progress: (row.progress as number) ?? 0,
    status: String(row.status ?? "active"),
    level: row.level as string,
    targetDate: (row.target_date ?? row.due_date) as string,
    domainId: row.domain_id as string,
    habitContributionPct: row.habit_contribution_pct as number,
    taskContributionPct: row.task_contribution_pct as number,
    progressContributionPct: row.progress_contribution_pct as number,
  };
}

export class GoalRepository {
  constructor(private readonly db: DbClient) {}

  async findById(id: string, userId: string): Promise<GoalEntity | null> {
    const { data } = await this.db
      .from("goals")
      .select(GOAL_COLS)
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    return data ? new GoalEntity(mapRow(data)) : null;
  }

  async findAllActive(userId: string): Promise<GoalEntity[]> {
    const { data } = await this.db
      .from("goals")
      .select(GOAL_COLS)
      .eq("user_id", userId)
      .in("status", ["active", "paused"]);
    return (data ?? []).map((r) => new GoalEntity(mapRow(r)));
  }

  async save(entity: GoalEntity, userId: string): Promise<GoalEntity> {
    const { data, error } = await this.db
      .from("goals")
      .update({ progress: entity.props.progress, status: entity.props.status })
      .eq("user_id", userId)
      .eq("id", entity.id)
      .select(GOAL_COLS)
      .single();
    if (error) throw error;
    return new GoalEntity(mapRow(data));
  }
}
