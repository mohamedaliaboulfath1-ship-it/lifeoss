import { ValueObject } from "@/domains/core/entity";

/** Bounded 0–100 score value object */
export class Score extends ValueObject {
  constructor(readonly value: number) {
    super();
    this.value = Math.max(0, Math.min(100, Math.round(value)));
  }

  equals(other: ValueObject): boolean {
    return other instanceof Score && other.value === this.value;
  }

  label(): string {
    if (this.value >= 80) return "ممتاز";
    if (this.value >= 65) return "جيد";
    if (this.value >= 45) return "متوسط";
    return "يحتاج تحسين";
  }
}

export class Percentage extends ValueObject {
  constructor(readonly value: number) {
    super();
    this.value = Math.max(0, Math.min(100, Math.round(value)));
  }

  equals(other: ValueObject): boolean {
    return other instanceof Percentage && other.value === this.value;
  }
}
