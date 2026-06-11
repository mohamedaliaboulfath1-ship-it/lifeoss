"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Goal } from "@/types/lifeos";

export type ExpandEntity = "goal" | "project" | "task" | "book" | "area";

export interface ExpandSnapshot {
  entity: ExpandEntity;
  id: string;
  title: string;
  subtitle?: string;
  progress?: number;
  icon?: string;
  href?: string;
  rect: { top: number; left: number; width: number; height: number };
}

type Phase = "idle" | "morphing";

interface ExpandTransitionContextValue {
  phase: Phase;
  snapshot: ExpandSnapshot | null;
  expandCard: (
    snapshot: Omit<ExpandSnapshot, "rect">,
    rect: DOMRect,
    onReveal?: () => void
  ) => void;
  expandGoal: (goal: Pick<Goal, "id" | "title" | "area" | "progress">, rect: DOMRect) => void;
  clearExpand: () => void;
}

const ExpandTransitionContext = createContext<ExpandTransitionContextValue | null>(null);

export function GoalExpandProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [snapshot, setSnapshot] = useState<ExpandSnapshot | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const onRevealRef = useRef<(() => void) | null>(null);

  const clearExpand = useCallback(() => {
    setPhase("idle");
    setSnapshot(null);
    onRevealRef.current = null;
  }, []);

  const expandCard = useCallback(
    (
      data: Omit<ExpandSnapshot, "rect">,
      rect: DOMRect,
      onReveal?: () => void
    ) => {
      setSnapshot({
        ...data,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
      });
      setPhase("morphing");
      onRevealRef.current = onReveal ?? null;
      if (data.href) {
        router.push(data.href);
      }
    },
    [router]
  );

  const expandGoal = useCallback(
    (goal: Pick<Goal, "id" | "title" | "area" | "progress">, rect: DOMRect) => {
      expandCard(
        {
          entity: "goal",
          id: goal.id,
          title: goal.title,
          progress: goal.progress ?? 0,
          subtitle: "Goal Command Center",
          href: `/goals/${goal.id}`,
        },
        rect
      );
    },
    [expandCard]
  );

  useEffect(() => {
    if (!snapshot || phase !== "morphing") return;
    const t = setTimeout(() => {
      if (onRevealRef.current) onRevealRef.current();
      if (!snapshot.href) clearExpand();
    }, 460);
    return () => clearTimeout(t);
  }, [snapshot, phase, clearExpand]);

  useEffect(() => {
    if (!snapshot?.href) return;
    const target = snapshot.href.split("?")[0];
    if (pathname === target || pathname.startsWith(`${target}/`)) return;
    const base = target.split("/").slice(0, 2).join("/");
    if (!pathname.startsWith(base)) clearExpand();
  }, [pathname, snapshot, clearExpand]);

  return (
    <ExpandTransitionContext.Provider
      value={{ phase, snapshot, expandCard, expandGoal, clearExpand }}
    >
      {children}
    </ExpandTransitionContext.Provider>
  );
}

export function useExpandTransition() {
  const ctx = useContext(ExpandTransitionContext);
  if (!ctx) throw new Error("useExpandTransition requires GoalExpandProvider");
  return ctx;
}

export function useExpandTransitionOptional() {
  return useContext(ExpandTransitionContext);
}

/** @deprecated use useExpandTransition */
export function useGoalExpand() {
  return useExpandTransition();
}

export function useGoalExpandOptional() {
  return useExpandTransitionOptional();
}
