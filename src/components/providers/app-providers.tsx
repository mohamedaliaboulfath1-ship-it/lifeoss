"use client";

import { LifeOSProvider } from "@/contexts/lifeos-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { ToastProvider } from "@/contexts/toast-context";
import { ToastContainer } from "@/components/ui/toast-container";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LifeOSProvider>
          {children}
          <ToastContainer />
        </LifeOSProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
