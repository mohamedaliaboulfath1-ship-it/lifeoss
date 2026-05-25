import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function fmt(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA");
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function commas(n: number) {
  return Math.round(n).toLocaleString("ar-SA");
}

export function isThisWeek(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  return d >= startOfWeek;
}

export function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const sat = new Date(now);
  sat.setDate(now.getDate() - ((day + 1) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sat);
    d.setDate(sat.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}
