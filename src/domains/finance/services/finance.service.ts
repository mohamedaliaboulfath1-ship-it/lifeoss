import type { DbClient } from "@/domains/core/repository";
import { buildWealthSnapshot } from "@/lib/wealth/snapshot";

export class FinanceRepository {
  constructor(private readonly db: DbClient) {}

  async buildWealthSnapshot(userId: string) {
    return buildWealthSnapshot(this.db, userId);
  }
}

export class FinanceService {
  constructor(private readonly repo?: FinanceRepository) {}

  async getWealthSnapshot(userId: string) {
    return this.repo?.buildWealthSnapshot(userId);
  }
}

export const financeService = new FinanceService();
