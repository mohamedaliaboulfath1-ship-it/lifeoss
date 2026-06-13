import { Entity } from "@/domains/core/entity";

export class ProjectEntity extends Entity {
  constructor(
    id: string,
    readonly title: string,
    readonly progress: number,
    readonly goalId?: string
  ) {
    super(id);
  }
}
