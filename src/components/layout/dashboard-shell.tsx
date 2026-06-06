"use client";

import { useLifeOS } from "@/contexts/lifeos-context";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { CommandPalette } from "@/components/layout/command-palette";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data, loading, error, setCurrentYear } = useLifeOS();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data?.profile) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg text-rose2 px-6 text-center text-sm max-w-md">
        {error ??
          "خطأ في تحميل الملف الشخصي — تأكد من تسجيل الدخول وإعداد Supabase في .env.local"}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userName={data.profile.displayName}
        currentYear={data.currentYear}
        years={data.years}
        habitCount={data.yearData.habits?.length ?? 0}
        onYearChange={setCurrentYear}
      />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
