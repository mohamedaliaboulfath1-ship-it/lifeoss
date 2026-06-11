"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Goal } from "@/types/lifeos";

export interface GoalExpandSnapshot {
  goalId: string;
  title: string;
  progress: number;
  area: string;
  rect: { top: number; left: number; width: number; height: number };
}

type Phase = "idle" | "morphing" | "revealed";

interface GoalExpandContextValue {
  phase: Phase;
  snapshot: GoalExpandSnapshot | null;
  expandGoal: (goal: Pick<Goal, "id" | "title" | "area" | "progress">, rect: DOMRect) => void;
  clearExpand: () => void;
}

const GoalExpandContext = createContext<GoalExpandContextValue | null>(null);

export function GoalExpandProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [snapshot, setSnapshot] = useState<GoalExpandSnapshot | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const expandGoal = useCallback(
    (goal: Pick<Goal, "id" | "title" | "area" | "progress">, rect: DOMRect) => {
      setSnapshot({
        goalId: goal.id,
        title: goal.title,
        progress: goal.progress ?? 0,
        area: goal.area,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
      });
      setPhase("morphing");
      router.push(`/goals/${goal.id}`);
    },
    [router]
  );

  const clearExpand = useCallback(() => {
    setPhase("idle");
    setSnapshot(null);
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    if (pathname === `/goals/${snapshot.goalId}`) return;
    if (!pathname.startsWith("/goals/")) {
      clearExpand();
    }
  }, [pathname, snapshot, clearExpand]);

  return (
    <GoalExpandContext.Provider value={{ phase, snapshot, expandGoal, clearExpand }}>
      {children}
    </GoalExpandContext.Provider>
  );
}

export function useGoalExpand() {
  const ctx = useContext(GoalExpandContext);
  if (!ctx) throw new Error("useGoalExpand must be used within GoalExpandProvider");
  return ctx;
}

export function useGoalExpandOptional() {
  return useContext(GoalExpandContext);
}
