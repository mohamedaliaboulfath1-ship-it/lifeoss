import { eventBus, habitCompletedEvent } from "@/domains/core/event-bus";
import { HabitEntity, type HabitProps } from "@/domains/habits/entities/habit.entity";
import { HabitRepository } from "@/domains/habits/repositories/habit.repository";

export class HabitService {
  constructor(private readonly repo?: HabitRepository) {}

  createEntity(props: HabitProps): HabitEntity {
    return new HabitEntity(props);
  }

  async completeHabit(userId: string, habitId: string, date: string): Promise<void> {
    await eventBus.publish(habitCompletedEvent(userId, habitId, date));
  }

  async getActiveHabits(userId: string): Promise<HabitEntity[]> {
    return this.repo?.findAllActive(userId) ?? [];
  }
}

export const habitService = new HabitService();
