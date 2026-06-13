import { areaHealthEngine } from "./engines/area-health.engine";
import { goalProgressEngine } from "./engines/goal-progress.engine";
import { habitScoreEngine } from "./engines/habit-score.engine";
import { lifeScoreEngine } from "./engines/life-score.engine";
import { forecastEngine } from "./engines/forecast.engine";
import { recommendationEngine } from "./engines/recommendation.engine";

/** Facade for all intelligence engines */
export class IntelligenceService {
  readonly lifeScore = lifeScoreEngine;
  readonly areaHealth = areaHealthEngine;
  readonly goalProgress = goalProgressEngine;
  readonly habitScore = habitScoreEngine;
  readonly forecast = forecastEngine;
  readonly recommendations = recommendationEngine;
}

export const intelligenceService = new IntelligenceService();

export { areaHealthEngine, calcAreaHealthScore, scoreLabel } from "./engines/area-health.engine";
export { goalProgressEngine } from "./engines/goal-progress.engine";
export { habitScoreEngine } from "./engines/habit-score.engine";
export { lifeScoreEngine } from "./engines/life-score.engine";
export { forecastEngine } from "./engines/forecast.engine";
export { recommendationEngine } from "./engines/recommendation.engine";
