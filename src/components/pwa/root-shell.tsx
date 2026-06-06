"use client";

import { RegisterServiceWorker } from "@/components/pwa/register-sw";

/** Registers PWA service worker on all routes (including auth pages). */
export function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RegisterServiceWorker />
    </>
  );
}
