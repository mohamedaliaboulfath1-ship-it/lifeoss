"use client";

import { useCallback, useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import {
  PRIMARY_GOAL_OPTIONS,
  type PrimaryGoal,
} from "@/lib/tenant/constants";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PrimaryGoalPickerProps {
  open: boolean;
  onComplete: () => void;
}

export function PrimaryGoalPicker({ open, onComplete }: PrimaryGoalPickerProps) {
  const [selected, setSelected] = useState<PrimaryGoal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select_goal", primaryGoal: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل الإعداد");
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الإعداد");
    } finally {
      setLoading(false);
    }
  }, [selected, onComplete]);

  return (
    <AppModal
      open={open}
      onClose={() => {}}
      title="مرحباً في LifeOS"
      subtitle="ما هو هدفك الرئيسي؟ سنُجهّز لك نظاماً كاملاً ببيانات تجريبية — ليس بيانات حقيقية."
      size="lg"
      dismissible={false}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRIMARY_GOAL_OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setSelected(opt.id)}
            className={cn(
              "text-right p-4 rounded-xl border transition-all",
              "hover:border-gold/40 hover:bg-gold/5",
              selected === opt.id
                ? "border-gold bg-gold/10 ring-1 ring-gold/30"
                : "border-border2 bg-surface/60"
            )}
          >
            <div className="text-2xl mb-2">{opt.icon}</div>
            <div className="font-bold text-sm">{opt.label}</div>
            <div className="text-xs text-text3 mt-1">{opt.description}</div>
          </motion.button>
        ))}
      </div>

      {error && (
        <p className="text-rose2 text-sm mt-4 text-center">{error}</p>
      )}

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border/60">
        <Button
          variant="gold"
          disabled={!selected || loading}
          onClick={submit}
        >
          {loading ? "جاري الإعداد…" : "ابدأ رحلتي"}
        </Button>
      </div>
    </AppModal>
  );
}
