import { eventBus } from "@/domains/core/event-bus";

/** Analytics auto-update on domain events */
const analyticsHandlers: Record<string, (payload: Record<string, unknown>) => void> = {
  HabitCompleted: () => {
    /* Invalidate analytics cache keys when TanStack hooks expand */
  },
  TaskCompleted: () => {},
  GoalUpdated: () => {},
  WeightUpdated: () => {},
  BookFinished: () => {},
  InvestmentAdded: () => {},
};

export function registerAnalyticsEventHandlers(): void {
  for (const [type, handler] of Object.entries(analyticsHandlers)) {
    eventBus.on(type, (event) => handler(event.payload));
  }
}

// Auto-register on module load (server-safe no-op if unused)
if (typeof window !== "undefined") {
  registerAnalyticsEventHandlers();
}
