"use client";

import { useEffect } from "react";
import { LifeOSProvider } from "@/contexts/lifeos-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { loadLayoutPrefs } from "@/lib/preferences/layout";
import { ToastProvider } from "@/contexts/toast-context";
import { GoalExpandProvider } from "@/contexts/goal-expand-context";
import { AchievementProvider } from "@/contexts/achievement-context";
import { ToastContainer } from "@/components/ui/toast-container";

function AccentBootstrap() {
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-accent",
      loadLayoutPrefs().accentTheme
    );
  }, []);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AccentBootstrap />
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
