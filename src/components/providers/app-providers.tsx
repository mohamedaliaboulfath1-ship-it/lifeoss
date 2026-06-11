"use client";

import { LifeOSProvider } from "@/contexts/lifeos-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { ToastProvider } from "@/contexts/toast-context";
import { GoalExpandProvider } from "@/contexts/goal-expand-context";
import { AchievementProvider } from "@/contexts/achievement-context";
import { ToastContainer } from "@/components/ui/toast-container";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LifeOSProvider>
          <AchievementProvider>
            <GoalExpandProvider>
              {children}
              <ToastContainer />
            </GoalExpandProvider>
          </AchievementProvider>
        </LifeOSProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
