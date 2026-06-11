"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AchievementBurst } from "@/components/emotion/achievement-burst";

export type AchievementKind =
  | "habit"
  | "task"
  | "goal"
  | "weight"
  | "finance"
  | "learning"
  | "streak";

export interface Achievement {
  id: number;
  kind: AchievementKind;
  title: string;
  subtitle?: string;
  emoji?: string;
}

interface AchievementContextValue {
  celebrate: (a: Omit<Achievement, "id">) => void;
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Achievement | null>(null);
  const seqRef = useRef(0);

  const celebrate = useCallback((a: Omit<Achievement, "id">) => {
    seqRef.current += 1;
    setActive({ ...a, id: seqRef.current });
    setTimeout(() => setActive(null), 1400);
  }, []);

  return (
    <AchievementContext.Provider value={{ celebrate }}>
      {children}
      <AchievementBurst achievement={active} />
    </AchievementContext.Provider>
  );
}

export function useAchievement() {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error("useAchievement requires AchievementProvider");
  return ctx;
}

export function useAchievementOptional() {
  return useContext(AchievementContext);
}
