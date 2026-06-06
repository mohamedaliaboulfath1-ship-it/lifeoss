/** Stable IDs for idempotent v1 import */

export function v1Id(entity: string, legacyId: number | string): string {
  return `v1_${entity}_${legacyId}`;
}

export function parseLegacyId(id: unknown): number | null {
  if (id === null || id === undefined) return null;
  const n = typeof id === "number" ? id : parseInt(String(id), 10);
  return Number.isFinite(n) ? n : null;
}

export function goalRef(legacyGoalId: number | null | undefined): string | null {
  if (legacyGoalId == null || legacyGoalId === 0) return null;
  return v1Id("goal", legacyGoalId);
}

export function habitRef(legacyHabitId: number | null | undefined): string | null {
  if (legacyHabitId == null) return null;
  return v1Id("habit", legacyHabitId);
}

export function exerciseRef(legacyId: number | null | undefined): string | null {
  if (legacyId == null) return null;
  return v1Id("exercise", legacyId);
}

export function foodRef(legacyId: number | null | undefined): string | null {
  if (legacyId == null) return null;
  return v1Id("food", legacyId);
}

export function bookRef(legacyId: number | null | undefined): string | null {
  if (legacyId == null) return null;
  return v1Id("book", legacyId);
}
