import type { DbClient } from "@/domains/core/repository";
import { HabitEntity, type HabitProps } from "@/domains/habits/entities/habit.entity";

const HABIT_COLS =
  "id, name, cat, frequency, active_days, goal_id, project_id, domain_id, active, impact, life_score_weight";

function mapRow(row: Record<string, unknown>): HabitProps {
  return {
    id: String(row.id),
    name: String(row.name),
    activeDays: (row.active_days as number[]) ?? [0, 1, 2, 3, 4, 5, 6],
    impact: (row.impact as HabitProps["impact"]) ?? "medium",
    lifeScoreWeight: (row.life_score_weight as number) ?? 1,
    active: row.active !== false,
  };
}

export class HabitRepository {
  constructor(private readonly db: DbClient) {}

  async findById(id: string, userId: string): Promise<HabitEntity | null> {
    const { data } = await this.db
      .from("habits")
      .select(HABIT_COLS)
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    return data ? new HabitEntity(mapRow(data)) : null;
  }

  async findAllActive(userId: string): Promise<HabitEntity[]> {
    const { data } = await this.db
      .from("habits")
      .select(HABIT_COLS)
      .eq("user_id", userId)
      .eq("active", true);
    return (data ?? []).map((r) => new HabitEntity(mapRow(r)));
  }

  async getLogs(userId: string): Promise<Record<string, Record<string, boolean>>> {
    const { data } = await this.db
      .from("habit_logs")
      .select("habit_id, log_date, done")
      .eq("user_id", userId);
    const map: Record<string, Record<string, boolean>> = {};
    for (const l of data ?? []) {
      if (!map[l.habit_id]) map[l.habit_id] = {};
      map[l.habit_id][l.log_date] = l.done;
    }
    return map;
  }
}
