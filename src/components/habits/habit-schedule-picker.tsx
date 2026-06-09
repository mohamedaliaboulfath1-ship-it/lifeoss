"use client";

import { SCHEDULE_PRESETS } from "@/lib/habits/schedule";
import type { FrequencyType } from "@/lib/habits/schedule";

interface Props {
  frequencyType: FrequencyType;
  frequencyValue: Record<string, unknown>;
  onChange: (type: FrequencyType, value: Record<string, unknown>) => void;
}

export function HabitSchedulePicker({ frequencyType, frequencyValue, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-text3">جدول التكرار</div>
      <div className="flex flex-wrap gap-2">
        {SCHEDULE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.frequencyType, p.frequencyValue as Record<string, unknown>)}
            className={`text-[11px] px-2.5 py-1.5 rounded-full border transition-all ${
              frequencyType === p.frequencyType &&
              JSON.stringify(frequencyValue) === JSON.stringify(p.frequencyValue)
                ? "border-gold text-gold2 bg-gold/10"
                : "border-border text-text3 hover:border-gold/40"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
