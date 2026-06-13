import { Entity } from "@/domains/core/entity";

export class TaskEntity extends Entity {
  constructor(
    id: string,
    readonly title: string,
    readonly status: string,
    readonly priority: string,
    readonly dueDate?: string,
    readonly goalId?: string
  ) {
    super(id);
  }

  isOverdue(today: string): boolean {
    return Boolean(this.dueDate && this.dueDate < today && this.status !== "done");
  }

  isDone(): boolean {
    return this.status === "done";
  }
}
