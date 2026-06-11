"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { areaColor } from "@/lib/calculations";
import { calcGoalProbability } from "@/lib/dashboard/goal-probability";
import { useGoalExpandOptional } from "@/contexts/goal-expand-context";
import { cardHover, cardTap } from "@/lib/motion/card";
import type { Goal } from "@/types/lifeos";
import { cn } from "@/lib/utils";

interface PremiumGoalCardProps {
  goal: Goal;
  onDelete?: () => void;
  onBumpProgress?: () => void;
  compact?: boolean;
  className?: string;
}

export function PremiumGoalCard({
  goal,
  onDelete,
  onBumpProgress,
  compact = false,
  className,
}: PremiumGoalCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const expand = useGoalExpandOptional();
  const pct = goal.progress ?? 0;
  const prob = calcGoalProbability({
    progress: pct,
    target_date: goal.targetDate ?? goal.due,
    created_at: goal.createdAt,
    status: goal.status,
  });
  const color = areaColor(goal.area);
  const prColors = { high: "var(--rose)", med: "var(--amber2)", low: "var(--emerald)" };

  function handleOpen() {
    const rect = ref.current?.getBoundingClientRect();
    if (rect && expand) {
      expand.expandGoal(goal, rect);
    } else {
      router.push(`/goals/${goal.id}`);
    }
  }

  return (
    <motion.div
      ref={ref}
      layout
      whileHover={cardHover}
      whileTap={cardTap}
      className={cn("h-full", className)}
    >
      <Card
        className={cn(
          "h-full p-4 cursor-pointer group glass-premium",
          "hover:border-gold/30 hover:shadow-premium transition-shadow",
          compact && "p-3"
        )}
        onClick={handleOpen}
      >
        <div className="flex gap-3 items-start">
          <ProgressRing
            value={pct}
            size={compact ? 48 : 56}
            strokeWidth={4}
            color={color}
            showValue
            suffix="%"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ background: prColors[goal.priority] }}
              />
              <h3 className={cn("font-semibold leading-snug group-hover:text-gold2 transition-colors", compact ? "text-xs line-clamp-2" : "text-sm")}>
                {goal.title}
              </h3>
            </div>
            {prob && (
              <p className="text-[10px] text-text3 mb-2 line-clamp-1">{prob.text}</p>
            )}
            {!compact && onBumpProgress && (
              <button
                type="button"
                className="text-[10px] text-gold2 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onBumpProgress();
                }}
              >
                + تحديث التقدم
              </button>
            )}
          </div>
          {onDelete && !compact && (
            <Button
              variant="danger"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              🗑
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
