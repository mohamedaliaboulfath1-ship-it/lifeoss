"use client";

import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { EnrichedHabit } from "@/types/para";

const IMPACT_LABELS = { low: "منخفض", medium: "متوسط", high: "عالي" };
const PRIORITY_COLORS = {
  low: "text-text3",
  normal: "text-sky2",
  high: "text-amber2",
  critical: "text-rose2",
};

interface Props {
  habit: EnrichedHabit;
  onToggle: () => void;
  onEdit?: () => void;
  pending?: boolean;
}

export function HabitCard({ habit, onToggle, onEdit, pending }: Props) {
  const dayNames = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
  const activeDayLabels = habit.activeDays.map((d) => dayNames[d]).join(" · ");

  return (
    <Card className="p-4 border-border2 hover:border-gold/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm truncate">{habit.name}</h3>
            <span className={`text-[10px] font-bold uppercase ${PRIORITY_COLORS[habit.priority]}`}>
              {habit.impact === "high" ? "High Impact" : IMPACT_LABELS[habit.impact]}
            </span>
          </div>
          <div className="text-xs text-text3 mt-1">
            {habit.domainIcon} {habit.domainName ?? habit.cat}
          </div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={onToggle}
          className={`w-9 h-9 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
            habit.doneToday ? "bg-emerald border-emerald text-white" : "border-border2 hover:border-gold/50"
          } ${pending ? "opacity-60" : ""}`}
        >
          {habit.doneToday ? "✓" : ""}
        </button>
      </div>

      {(habit.goalTitle || habit.projectTitle) && (
        <div className="text-xs space-y-1 mb-3 p-2 rounded-sm bg-surface2/80 border border-border/50">
          {habit.goalTitle && (
            <div><span className="text-text3">هدف:</span> <strong>{habit.goalTitle}</strong></div>
          )}
          {habit.projectTitle && (
            <div><span className="text-text3">مشروع:</span> <strong>{habit.projectTitle}</strong></div>
          )}
        </div>
      )}

      {habit.why && (
        <p className="text-[11px] text-text3 mb-3 italic">لماذا: {habit.why}</p>
      )}

      <div className="grid grid-cols-3 gap-2 text-center text-[11px] mb-3">
        <div className="p-2 rounded-sm bg-surface2">
          <div className="font-black text-gold2">{habit.currentStreak}</div>
          <div className="text-text3">السلسلة</div>
        </div>
        <div className="p-2 rounded-sm bg-surface2">
          <div className="font-black text-sky2">{habit.bestStreak}</div>
          <div className="text-text3">أفضل</div>
        </div>
        <div className="p-2 rounded-sm bg-surface2">
          <div className="font-black text-emerald2">{habit.adherencePct}%</div>
          <div className="text-text3">التزام</div>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-text3 mb-1">
          <span>Life Score مساهمة</span>
          <span>{habit.lifeScoreContribution}%</span>
        </div>
        <ProgressBar value={habit.lifeScoreContribution} color="var(--gold)" />
      </div>

      <div className="text-[10px] text-text3">الأيام: {activeDayLabels}</div>

      {habit.stopImpact && (
        <div className="text-[10px] text-rose2/80 mt-2">
          إذا توقفت: {habit.stopImpact}
        </div>
      )}

      {onEdit && (
        <button type="button" className="text-[11px] text-gold2 mt-3 hover:underline" onClick={onEdit}>
          تعديل الربط
        </button>
      )}
    </Card>
  );
}
