import type { LifeScoreInput } from "@/domains/intelligence/types";
import { Score } from "@/domains/shared/value-objects/score.vo";

/**
 * Life Score engine — context-aware formulas.
 * Preserves backward compatibility: each context keeps its historical weights.
 */
export class LifeScoreEngine {
  calculate(input: LifeScoreInput): Score {
    switch (input.context) {
      case "dashboard":
        return new Score(
          Math.round(
            input.habitPct * 0.25 +
              input.goalPct * 0.2 +
              (input.nutritionPct ?? 0) * 0.15 +
              (input.workoutPct ?? 0) * 0.15 +
              (input.taskPct ?? 0) * 0.1 +
              (input.savingsPct ?? 0) * 0.15
          )
        );
      case "analytics":
        return new Score(
          Math.round(
            (input.habitPct +
              input.goalPct +
              (input.financePct ?? 0) +
              (input.learningPct ?? 0) +
              (input.healthPct ?? 0)) /
              5
          )
        );
      case "areas": {
        const scores = input.areaScores ?? [];
        if (!scores.length) return new Score(0);
        return new Score(Math.round(scores.reduce((s, v) => s + v, 0) / scores.length));
      }
      default:
        return new Score(0);
    }
  }
}

export const lifeScoreEngine = new LifeScoreEngine();
