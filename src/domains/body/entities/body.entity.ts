import { Entity, validationFail, validationOk, type ValidationResult } from "@/domains/core/entity";

export class BodyMeasurementEntity extends Entity {
  constructor(
    id: string,
    readonly chest?: number,
    readonly arm?: number,
    readonly waist?: number,
    readonly thigh?: number,
    readonly calf?: number,
    readonly heightCm?: number
  ) {
    super(id);
  }

  validate(): ValidationResult {
    const values = [this.chest, this.arm, this.waist, this.thigh, this.calf].filter(
      (v) => v != null
    );
    if (!values.length) return validationFail("قياس واحد على الأقل مطلوب");
    return validationOk();
  }

  calculateBMI(weightKg: number): number | null {
    if (!this.heightCm || this.heightCm <= 0) return null;
    const h = this.heightCm / 100;
    return Math.round((weightKg / (h * h)) * 10) / 10;
  }
}

export class WeightEntryEntity extends Entity {
  constructor(
    id: string,
    readonly weight: number,
    readonly logDate: string
  ) {
    super(id);
  }

  validate(): ValidationResult {
    if (this.weight <= 0 || this.weight > 500) return validationFail("الوزن غير صالح");
    if (!this.logDate) return validationFail("التاريخ مطلوب");
    return validationOk();
  }

  progressTowardTarget(current: number, target: number, start: number): number {
    if (target === start) return current >= target ? 100 : 0;
    return Math.max(0, Math.min(100, Math.round(((current - start) / (target - start)) * 100)));
  }
}
