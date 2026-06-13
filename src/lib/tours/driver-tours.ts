"use client";

import type { Config, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

export const TOUR_IDS = {
  dashboard: "tour_dashboard",
  goals: "tour_goals",
  habits: "tour_habits",
  lifeMap: "tour_life_map",
} as const;

export type TourId = (typeof TOUR_IDS)[keyof typeof TOUR_IDS];

export const TOUR_DEFINITIONS: Record<
  TourId,
  { title: string; steps: DriveStep[] }
> = {
  [TOUR_IDS.dashboard]: {
    title: "جولة لوحة التحكم",
    steps: [
      {
        element: "[data-tour='sidebar']",
        popover: {
          title: "القائمة الجانبية",
          description: "هنا تجد كل وحدات LifeOS — أهداف، عادات، مال، جسد، وتعلّم.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "[data-tour='main-content']",
        popover: {
          title: "لوحة التحكم",
          description: "نظرة شاملة على يومك — النقاط، العادات، والأولويات.",
          side: "left",
          align: "start",
        },
      },
    ],
  },
  [TOUR_IDS.goals]: {
    title: "جولة مركز الأهداف",
    steps: [
      {
        element: "[data-tour='main-content']",
        popover: {
          title: "مركز الأهداف",
          description: "حوّل أحلامك إلى أهداف قابلة للقياس مع مهام وعادات مرتبطة.",
          side: "bottom",
        },
      },
    ],
  },
  [TOUR_IDS.habits]: {
    title: "جولة متتبع العادات",
    steps: [
      {
        element: "[data-tour='main-content']",
        popover: {
          title: "متتبع العادات",
          description: "ابنِ سلاسل يومية — Never Miss Twice.",
          side: "bottom",
        },
      },
    ],
  },
  [TOUR_IDS.lifeMap]: {
    title: "جولة خريطة الحياة",
    steps: [
      {
        element: "[data-tour='main-content']",
        popover: {
          title: "خريطة الحياة",
          description: "اربط الرؤية طويلة المدى بالأهداف والمشاريع.",
          side: "bottom",
        },
      },
    ],
  },
};

export function driverConfig(steps: DriveStep[], onDone?: () => void): Config {
  return {
    showProgress: true,
    progressText: "{{current}} من {{total}}",
    nextBtnText: "التالي",
    prevBtnText: "السابق",
    doneBtnText: "تم",
    steps,
    onDestroyed: onDone,
  };
}

export async function startTour(tourId: TourId, onComplete?: () => void) {
  const { driver } = await import("driver.js");
  const def = TOUR_DEFINITIONS[tourId];
  if (!def) return;

  const d = driver(
    driverConfig(def.steps, async () => {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_tour", tourId }),
      });
      onComplete?.();
    })
  );
  d.drive();
}
