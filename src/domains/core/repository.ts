import type { SupabaseClient } from "@supabase/supabase-js";

/** Repository contract — Dependency Inversion (SOLID) */
export interface Repository<T, TId extends string = string> {
  findById(id: TId, userId: string): Promise<T | null>;
  findAll(userId: string): Promise<T[]>;
  save(entity: T, userId: string): Promise<T>;
  delete(id: TId, userId: string): Promise<void>;
}

export type DbClient = SupabaseClient;

export interface RepositoryContext {
  db: DbClient;
  userId: string;
}
