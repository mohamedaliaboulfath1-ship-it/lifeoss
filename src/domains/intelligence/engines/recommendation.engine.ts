/** Recommendation engine — aggregates coach insights across domains */
export class RecommendationEngine {
  prioritize<T extends { priority: string; message: string }>(items: T[]): T[] {
    const order: Record<string, number> = { high: 0, normal: 1, low: 2 };
    return [...items].sort(
      (a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9)
    );
  }

  topRecommendations<T extends { priority: string }>(items: T[], limit = 5): T[] {
    return this.prioritize(items as (T & { message: string })[]).slice(0, limit) as T[];
  }
}

export const recommendationEngine = new RecommendationEngine();
