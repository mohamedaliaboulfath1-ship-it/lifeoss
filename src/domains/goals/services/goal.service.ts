import { goalProgressEngine } from "@/domains/intelligence/engines/goal-progress.engine";
import { habitScoreEngine } from "@/domains/intelligence/engines/habit-score.engine";
import { GoalEntity } from "@/domains/goals/entities/goal.entity";
import { GoalRepository } from "@/domains/goals/repositories/goal.repository";
import type { GoalCompletion } from "@/types/para";
import type { Goal, Habit } from "@/types/lifeos";

/** Goal domain service — business logic only, no UI */
export class GoalService {
  constructor(private readonly repo?: GoalRepository) {}

  createEntity(goal: Goal): GoalEntity {
    return new GoalEntity({
      id: goal.id,
      title: goal.title,
      progress: goal.progress,
      status: goal.status,
      level: goal.level,
      targetDate: goal.targetDate ?? goal.due,
      domainId: goal.domainId,
      habitContributionPct: goal.habitContributionPct,
      taskContributionPct: goal.taskContributionPct,
      progressContributionPct: goal.progressContributionPct,
      tasks: goal.tasks,
    });
  }

  calculateCompletionScore(input: {
    goal: Goal;
    linkedHabits: Habit[];
    logs: Record<string, Record<string, boolean>>;
    linkedTaskDone?: number;
    linkedTaskTotal?: number;
  }): GoalCompletion {
    return goalProgressEngine.calculateCompletion({
      goal: input.goal,
      linkedHabits: input.linkedHabits.map((h) => ({
        id: h.id,
        activeDays: (h as Habit & { activeDays?: number[] }).activeDays,
      })),
      logs: input.logs,
      linkedTaskDone: input.linkedTaskDone,
      linkedTaskTotal: input.linkedTaskTotal,
      habitAdherenceFn: (id, logs, days, window) =>
        habitScoreEngine.adherence(id, logs, days, window),
    }) as GoalCompletion;
  }

  async getById(id: string, userId: string): Promise<GoalEntity | null> {
    return this.repo?.findById(id, userId) ?? null;
  }
}

export const goalService = new GoalService();
