import { SUPER_ADMIN_EMAIL } from "./constants";

export type UserRole = "user" | "admin" | "super_admin";

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export function isSuperAdmin(
  email: string | null | undefined,
  role: UserRole | string | undefined
): boolean {
  return role === "super_admin" || (role === "admin" && isSuperAdminEmail(email));
}

/** Skip demo onboarding, templates, and welcome redirects — master account always protected */
export function shouldSkipOnboarding(
  email: string | null | undefined,
  role: UserRole | string | undefined
): boolean {
  if (isSuperAdminEmail(email)) return true;
  return isSuperAdmin(email, role);
}

/** Welcome center visible only for new accounts still in onboarding */
export function shouldShowWelcomeCenter(
  email: string | null | undefined,
  role: UserRole | string | undefined,
  profile?: {
    onboarded?: boolean;
    saas?: { onboardingCompleted?: boolean };
  }
): boolean {
  if (shouldSkipOnboarding(email, role)) return false;
  if (profile?.onboarded) return false;
  if (profile?.saas?.onboardingCompleted) return false;
  return true;
}

export function isAdminRole(role: UserRole | string | undefined): boolean {
  return role === "admin" || role === "super_admin";
}
