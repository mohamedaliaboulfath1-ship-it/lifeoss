"use client";

import { useLifeOSData, useLifeOSActions } from "@/contexts/lifeos-context";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { CommandPalette } from "@/components/layout/command-palette";
import { NavTracker } from "@/components/layout/nav-tracker";
import { MobileNavProvider, useMobileNav } from "@/contexts/mobile-nav-context";
import { GoalExpandOverlay } from "@/components/goals/goal-expand-overlay";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { data } = useLifeOSData();
  const { setCurrentYear } = useLifeOSActions();
  const { isOpen, close } = useMobileNav();

  if (!data?.profile) return null;

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <NavTracker />
      <Sidebar
        userName={data.profile.displayName}
        avatarUrl={data.profile.avatarUrl}
        isAdmin={data.profile.role === "admin"}
        currentYear={data.currentYear}
        years={data.years}
        habitCount={data.yearData.habits?.length ?? 0}
        onYearChange={setCurrentYear}
        mobileOpen={isOpen}
        onMobileClose={close}
      />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0 w-full">
        {children}
      </main>
      <CommandPalette />
      <GoalExpandOverlay />
    </div>
  );
}

function ShellLoading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <aside
        className="hidden md:block w-[220px] shrink-0 glass-sidebar"
        aria-hidden
      >
        <div className="p-4 space-y-3">
          <div className="h-9 rounded-lg skeleton-shimmer" />
          <div className="h-6 w-2/3 rounded skeleton-shimmer" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 rounded-lg skeleton-shimmer" />
            ))}
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden flex flex-col min-w-0 w-full">
        {children}
      </main>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data, loading, error } = useLifeOSData();

  if (error && !data) {
    const message =
      error === "PROFILE_NOT_FOUND"
        ? "لم يُعثر على الملف الشخصي — شغّل استعلام إصلاح profiles في Supabase SQL Editor (راجع الدليل) ثم أعد تسجيل الدخول."
        : (error ??
          "خطأ في تحميل الملف الشخصي — تأكد من تسجيل الدخول وإعداد Supabase في .env.local");
    return (
      <div className="h-screen flex items-center justify-center bg-bg text-rose2 px-6 text-center text-sm max-w-md">
        {message}
      </div>
    );
  }

  if (loading && !data) {
    return (
      <MobileNavProvider>
        <ShellLoading>
          <DashboardSkeleton />
        </ShellLoading>
      </MobileNavProvider>
    );
  }

  return (
    <MobileNavProvider>
      <ShellInner>{children}</ShellInner>
    </MobileNavProvider>
  );
}
