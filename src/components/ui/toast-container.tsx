"use client";

import { useToast } from "@/contexts/toast-context";
import { cn } from "@/lib/utils";

const styles = {
  success: "border-emerald/30 bg-emerald/10 text-emerald2",
  error: "border-rose/30 bg-rose/10 text-rose2",
  warning: "border-amber/30 bg-amber/10 text-amber2",
  info: "border-sky/30 bg-sky/10 text-sky2",
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-[300] flex flex-col gap-2 max-w-sm"
      dir="rtl"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "px-4 py-3 rounded-sm border text-sm shadow-lg animate-fade-up flex items-start justify-between gap-3",
            styles[t.type]
          )}
        >
          <span>{t.message}</span>
          <button
            type="button"
            className="text-text3 hover:text-text shrink-0"
            onClick={() => dismiss(t.id)}
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
