import { buildBodyAnalytics } from "@/lib/body/analytics";
import { WeightEntryEntity } from "@/domains/body/entities/body.entity";
import type { Measurement, WeightLog } from "@/types/lifeos";

export class BodyService {
  buildAnalytics(input: {
    weightLogs: WeightLog[];
    measurements: Measurement[];
    startWeight?: number | null;
    targetWeight: number;
    heightCm?: number | null;
    currentWeightOverride?: number | null;
    weeklyGainTarget?: number;
  }) {
    return buildBodyAnalytics(input);
  }

  createWeightEntry(id: string, weight: number, logDate: string): WeightEntryEntity {
    return new WeightEntryEntity(id, weight, logDate);
  }
}

export const bodyService = new BodyService();
