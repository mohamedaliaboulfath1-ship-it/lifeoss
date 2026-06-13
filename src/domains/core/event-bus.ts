/** Domain events — in-process event bus */

export interface DomainEvent {
  readonly type: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly userId: string;
  readonly payload: Record<string, unknown>;
}

export type DomainEventHandler = (event: DomainEvent) => void | Promise<void>;

class EventBusImpl {
  private handlers = new Map<string, DomainEventHandler[]>();
  private globalHandlers: DomainEventHandler[] = [];

  on(eventType: string, handler: DomainEventHandler): () => void {
    const list = this.handlers.get(eventType) ?? [];
    list.push(handler);
    this.handlers.set(eventType, list);
    return () => {
      const idx = list.indexOf(handler);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  onAny(handler: DomainEventHandler): () => void {
    this.globalHandlers.push(handler);
    return () => {
      const idx = this.globalHandlers.indexOf(handler);
      if (idx >= 0) this.globalHandlers.splice(idx, 1);
    };
  }

  async publish(event: DomainEvent): Promise<void> {
    const typed = this.handlers.get(event.type) ?? [];
    const all = [...typed, ...this.globalHandlers];
    await Promise.all(all.map((h) => h(event)));
  }
}

export const eventBus = new EventBusImpl();

// --- Event factories ---

export function habitCompletedEvent(userId: string, habitId: string, date: string) {
  return {
    type: "HabitCompleted",
    occurredAt: new Date(),
    aggregateId: habitId,
    userId,
    payload: { habitId, date },
  } satisfies DomainEvent;
}

export function taskCompletedEvent(userId: string, taskId: string) {
  return {
    type: "TaskCompleted",
    occurredAt: new Date(),
    aggregateId: taskId,
    userId,
    payload: { taskId },
  } satisfies DomainEvent;
}

export function goalUpdatedEvent(userId: string, goalId: string, progress: number) {
  return {
    type: "GoalUpdated",
    occurredAt: new Date(),
    aggregateId: goalId,
    userId,
    payload: { goalId, progress },
  } satisfies DomainEvent;
}

export function weightUpdatedEvent(userId: string, weight: number, logDate: string) {
  return {
    type: "WeightUpdated",
    occurredAt: new Date(),
    aggregateId: userId,
    userId,
    payload: { weight, logDate },
  } satisfies DomainEvent;
}

export function bookFinishedEvent(userId: string, bookId: string) {
  return {
    type: "BookFinished",
    occurredAt: new Date(),
    aggregateId: bookId,
    userId,
    payload: { bookId },
  } satisfies DomainEvent;
}

export function investmentAddedEvent(userId: string, investmentId: string, amount: number) {
  return {
    type: "InvestmentAdded",
    occurredAt: new Date(),
    aggregateId: investmentId,
    userId,
    payload: { investmentId, amount },
  } satisfies DomainEvent;
}
