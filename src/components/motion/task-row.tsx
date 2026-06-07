"use client";

import { motion } from "framer-motion";
import { listItem, taskCompleteExit } from "@/lib/motion/list";
import { habitCheckPop } from "@/lib/motion/list";
import { MOTION } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LifeTask } from "@/types/lifeos";

interface TaskRowProps {
  task: LifeTask;
  pending: boolean;
  dimmed?: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

export function TaskRow({ task, pending, dimmed, onToggle, onRemove }: TaskRowProps) {
  const done = task.status === "done";

  return (
    <motion.li
      layout
      variants={listItem}
      initial="initial"
      animate="animate"
      exit={done ? taskCompleteExit : listItem.exit}
      className={cn(
        "flex items-center gap-3 py-2 border-b border-border/50 last:border-0",
        dimmed && "opacity-45"
      )}
    >
      <motion.button
        type="button"
        disabled={pending}
        onClick={onToggle}
        whileTap={{ scale: pending ? 1 : MOTION.scale.press }}
        className={cn(
          "w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 focus-ring",
          done ? "bg-emerald border-emerald" : "border-border2 bg-surface2 hover:border-gold/40",
          pending && "opacity-60"
        )}
        aria-label={done ? "إلغاء الإنجاز" : "إنجاز المهمة"}
      >
        {done && (
          <motion.span {...habitCheckPop}>
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </motion.span>
        )}
      </motion.button>
      <div className="flex-1 min-w-0">
        <motion.div
          className="text-sm font-medium"
          animate={{
            opacity: done ? 0.5 : 1,
            textDecorationLine: done ? "line-through" : "none",
          }}
          transition={{ duration: MOTION.duration.normal }}
        >
          {task.title}
        </motion.div>
        <div className="flex gap-2 text-[10px] text-text3 font-mono">
          {task.dueDate && <span>{task.dueDate}</span>}
          <span>{(task.priority ?? "p3").toUpperCase()}</span>
          {task.estimatedTime ? <span>{task.estimatedTime}د</span> : null}
        </div>
      </div>
      <Button variant="danger" size="sm" onClick={onRemove}>
        🗑
      </Button>
    </motion.li>
  );
}
