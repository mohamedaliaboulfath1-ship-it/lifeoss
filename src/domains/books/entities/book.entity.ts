import { Entity } from "@/domains/core/entity";

export class BookEntity extends Entity {
  constructor(
    id: string,
    readonly title: string,
    readonly progress: number,
    readonly status: string
  ) {
    super(id);
  }

  isFinished(): boolean {
    return this.status === "done" || this.progress >= 100;
  }
}
