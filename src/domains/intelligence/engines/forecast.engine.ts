export type ProbabilityLabel =
  | "ahead"
  | "on_track"
  | "slightly_behind"
  | "needs_attention";

export interface GoalProbability {
  label: ProbabilityLabel;
  text: string;
  className: "teal" | "emerald" | "amber" | "coral";
  delta: number;
}

/** Forecast engine — delegates to GoalProgressEngine for probability */
export class ForecastEngine {
  estimateWeeksToTarget(current: number, target: number, weeklyGain = 0.35): number | null {
    if (weeklyGain <= 0 || current >= target) return null;
    return Math.ceil((target - current) / weeklyGain);
  }
}

export const forecastEngine = new ForecastEngine();
