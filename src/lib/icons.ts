import {
  Target,
  RefreshCw,
  CheckSquare,
  Dumbbell,
  Utensils,
  BookOpen,
  Wallet,
  Briefcase,
  GraduationCap,
  Brain,
  Heart,
  Sparkles,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export const DOMAIN_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  goals: Target,
  habits: RefreshCw,
  tasks: CheckSquare,
  body: Dumbbell,
  workouts: Dumbbell,
  nutrition: Utensils,
  books: BookOpen,
  finance: Wallet,
  career: Briefcase,
  learning: GraduationCap,
  ai: Brain,
  analytics: Sparkles,
  reviews: Heart,
};

export function getDomainIcon(id: string): LucideIcon {
  return DOMAIN_ICONS[id] ?? Sparkles;
}

export const BOOK_TYPE_LABELS: Record<string, string> = {
  physical: "كتاب ورقي",
  ebook: "كتاب إلكتروني",
  pdf: "PDF",
  epub: "EPUB",
  audiobook: "كتب صوتية",
  reference: "مرجع",
  novel: "رواية",
  course: "مادة تعليمية",
};
