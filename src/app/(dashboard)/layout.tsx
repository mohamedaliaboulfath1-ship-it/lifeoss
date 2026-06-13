import { AppProviders } from "@/components/providers/app-providers";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <DashboardShell>
        <OnboardingGate />
        {children}
      </DashboardShell>
    </AppProviders>
  );
}
