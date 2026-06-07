import type { ExpenseCategory } from "@/types/wealth";
import { uid } from "@/lib/utils";

export const DEFAULT_CATEGORIES: Omit<ExpenseCategory, "id">[] = [
  { name: "سكن", slug: "housing", icon: "🏠", color: "var(--sky)", sortOrder: 1, isSystem: true },
  { name: "مواصلات", slug: "transport", icon: "🚗", color: "var(--purple)", sortOrder: 2, isSystem: true },
  { name: "طعام", slug: "food", icon: "🍽️", color: "var(--amber)", sortOrder: 3, isSystem: true },
  { name: "اشتراكات", slug: "subscriptions", icon: "📱", color: "var(--rose)", sortOrder: 4, isSystem: true },
  { name: "ترفيه", slug: "entertainment", icon: "🎬", color: "var(--teal)", sortOrder: 5, isSystem: true },
  { name: "صحة", slug: "health", icon: "💊", color: "var(--emerald)", sortOrder: 6, isSystem: true },
  { name: "تعليم", slug: "education", icon: "📚", color: "var(--gold)", sortOrder: 7, isSystem: true },
  { name: "أخرى", slug: "other", icon: "📦", color: "var(--text3)", sortOrder: 8, isSystem: true },
];

export function seedCategoryRows(userId: string) {
  return DEFAULT_CATEGORIES.map((c) => ({
    id: uid(),
    user_id: userId,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    color: c.color,
    sort_order: c.sortOrder,
    is_system: true,
    monthly_budget: null,
  }));
}

export function subscriptionMonthlyEquivalent(price: number, cycle: string): number {
  switch (cycle) {
    case "monthly": return price;
    case "quarterly": return price / 3;
    case "semi_annual": return price / 6;
    case "annual": return price / 12;
    default: return price;
  }
}
