"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLifeOSData, useLifeOSActions } from "@/contexts/lifeos-context";
import { PrimaryGoalPicker } from "./primary-goal-picker";
import { shouldSkipOnboarding } from "@/lib/tenant/super-admin";

export function OnboardingGate() {
  const { data } = useLifeOSData();
  const { refresh } = useLifeOSActions();
  const pathname = usePathname();
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!data?.profile) return;

    const skip = shouldSkipOnboarding(
      data.profile.email,
      data.profile.role
    );

    if (skip) {
      setChecked(true);
      return;
    }

    if (!data.profile.onboarded && !data.profile.saas?.demoSeeded) {
      if (!data.profile.saas?.primaryGoal) {
        setShowPicker(true);
        setChecked(true);
        return;
      }
      if (pathname !== "/welcome") {
        router.replace("/welcome");
      }
    }

    setChecked(true);
  }, [data, pathname, router]);

  if (!checked || !data) return null;

  return (
    <PrimaryGoalPicker
      open={showPicker}
      onComplete={async () => {
        setShowPicker(false);
        await refresh();
        router.push("/welcome");
      }}
    />
  );
}
