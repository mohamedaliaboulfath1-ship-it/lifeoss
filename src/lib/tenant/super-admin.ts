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

/** Skip demo onboarding, templates, and welcome redirects */
export function shouldSkipOnboarding(
  email: string | null | undefined,
  role: UserRole | string | undefined
): boolean {
  return isSuperAdmin(email, role);
}

export function isAdminRole(role: UserRole | string | undefined): boolean {
  return role === "admin" || role === "super_admin";
}
