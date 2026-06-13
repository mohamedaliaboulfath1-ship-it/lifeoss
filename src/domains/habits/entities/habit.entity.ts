import { Entity, validationFail, validationOk, type ValidationResult } from "@/domains/core/entity";
import { habitScoreEngine } from "@/domains/intelligence/engines/habit-score.engine";

export interface HabitProps {
  id: string;
  name: string;
  activeDays?: number[];
  impact?: "low" | "medium" | "high";
  lifeScoreWeight?: number;
  active?: boolean;
}

export class HabitEntity extends Entity {
  constructor(readonly props: HabitProps) {
    super(props.id);
  }

  validate(): ValidationResult {
    if (!this.props.name?.trim()) return validationFail("اسم العادة مطلوب");
    return validationOk();
  }

  currentStreak(logs: Record<string, Record<string, boolean>>): number {
    return habitScoreEngine.currentStreak(this.id, logs);
  }

  longestStreak(logs: Record<string, Record<string, boolean>>): number {
    return habitScoreEngine.longestStreak(this.id, logs);
  }

  adherence(logs: Record<string, Record<string, boolean>>, days = 30): number {
    const activeDays = this.props.activeDays ?? [0, 1, 2, 3, 4, 5, 6];
    return habitScoreEngine.adherence(this.id, logs, activeDays, days);
  }

  score(logs: Record<string, Record<string, boolean>>) {
    return habitScoreEngine.score({
      habitId: this.id,
      logs,
      activeDays: this.props.activeDays ?? [0, 1, 2, 3, 4, 5, 6],
      impact: this.props.impact,
      weight: this.props.lifeScoreWeight,
    });
  }
}
