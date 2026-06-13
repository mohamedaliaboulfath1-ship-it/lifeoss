/** Core domain primitives — LifeOS DDD foundation */

export abstract class Entity<TId extends string = string> {
  constructor(readonly id: TId) {}

  equals(other: Entity<TId>): boolean {
    return this.id === other.id;
  }
}

export abstract class ValueObject {
  abstract equals(other: ValueObject): boolean;
}

export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validationOk(): ValidationResult {
  return { valid: true, errors: [] };
}

export function validationFail(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}
