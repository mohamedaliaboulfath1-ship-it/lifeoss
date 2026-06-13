import { NAV_PAGES } from "@/lib/constants";
import { shouldShowWelcomeCenter } from "@/lib/tenant/super-admin";
import type { NavPage } from "@/types/lifeos";

export function getNavPagesForProfile(profile?: {
  email?: string;
  role?: string;
  onboarded?: boolean;
  saas?: { onboardingCompleted?: boolean };
}): NavPage[] {
  const showWelcome = shouldShowWelcomeCenter(
    profile?.email,
    profile?.role,
    profile
  );
  if (showWelcome) return NAV_PAGES;
  return NAV_PAGES.filter((p) => p.id !== "welcome");
}
