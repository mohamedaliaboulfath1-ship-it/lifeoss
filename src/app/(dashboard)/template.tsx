"use client";

import { PageTransitionShell } from "@/components/motion/page-transition-shell";

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransitionShell>{children}</PageTransitionShell>;
}
