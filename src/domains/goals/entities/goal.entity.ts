import { Entity, validationFail, validationOk, type ValidationResult } from "@/domains/core/entity";
import { goalProgressEngine } from "@/domains/intelligence/engines/goal-progress.engine";
import { GoalLevel, GoalStatus } from "@/domains/shared/enums/domain.enums";
import type { GoalCompletion } from "@/types/para";

export interface GoalProps {
  id: string;
  title: string;
  progress?: number;
  status?: string;
  level?: string;
  targetDate?: string | null;
  domainId?: string;
  habitContributionPct?: number;
  taskContributionPct?: number;
  progressContributionPct?: number;
  tasks?: { done?: boolean }[];
}

export class GoalEntity extends Entity {
  constructor(readonly props: GoalProps) {
    super(props.id);
  }

  validate(): ValidationResult {
    if (!this.props.title?.trim()) return validationFail("عنوان الهدف مطلوب");
    if ((this.props.progress ?? 0) < 0 || (this.props.progress ?? 0) > 100) {
      return validationFail("التقدم يجب أن يكون بين 0 و 100");
    }
    return validationOk();
  }

  isActive(): boolean {
    return this.props.status === GoalStatus.Active || this.props.status === GoalStatus.Paused;
  }

  isProject(): boolean {
    return this.props.level === GoalLevel.Project;
  }

  calculateMetricProgress(): number {
    return goalProgressEngine.calculateMetricProgress(this.props);
  }

  calculateProbability() {
    return goalProgressEngine.calculateProbability(this.props);
  }

  calculateCompletion(input: {
    linkedHabits: { id: string; activeDays?: number[] }[];
    logs: Record<string, Record<string, boolean>>;
    linkedTaskDone?: number;
    linkedTaskTotal?: number;
    habitAdherenceFn: (id: string, logs: Record<string, Record<string, boolean>>, days: number[], w: number) => number;
  }): GoalCompletion {
    return goalProgressEngine.calculateCompletion({
      goal: this.props,
      ...input,
    }) as GoalCompletion;
  }
}
