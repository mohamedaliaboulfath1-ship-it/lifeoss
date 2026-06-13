import { Entity, validationFail, validationOk, type ValidationResult } from "@/domains/core/entity";

export class InvestmentEntity extends Entity {
  constructor(
    id: string,
    readonly name: string,
    readonly costBasis: number,
    readonly currentValue: number
  ) {
    super(id);
  }

  validate(): ValidationResult {
    if (!this.name.trim()) return validationFail("اسم الاستثمار مطلوب");
    if (this.costBasis < 0 || this.currentValue < 0) return validationFail("القيم غير صالحة");
    return validationOk();
  }

  calculateROI(): number {
    if (this.costBasis <= 0) return 0;
    return Math.round(((this.currentValue - this.costBasis) / this.costBasis) * 1000) / 10;
  }

  gain(): number {
    return Math.round((this.currentValue - this.costBasis) * 100) / 100;
  }
}

export class TransactionEntity extends Entity {
  constructor(
    id: string,
    readonly amount: number,
    readonly type: string,
    readonly txDate: string
  ) {
    super(id);
  }

  validate(): ValidationResult {
    if (!this.txDate) return validationFail("تاريخ المعاملة مطلوب");
    return validationOk();
  }

  isIncome(): boolean {
    return this.type === "income";
  }

  isExpense(): boolean {
    return this.type === "expense" || this.type === "subscription";
  }
}
