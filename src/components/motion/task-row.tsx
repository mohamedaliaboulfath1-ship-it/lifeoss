"use client";

import { motion } from "framer-motion";
import { listItem, taskCompleteExit } from "@/lib/motion/list";
import { HabitCheck } from "@/components/motion/habit-check";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LifeTask } from "@/types/lifeos";

interface TaskRowProps {
  task: LifeTask;
  pending: boolean;
  dimmed?: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onCelebrate?: () => void;
}

export function TaskRow({ task, pending, dimmed, onToggle, onRemove, onCelebrate }: TaskRowProps) {
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
      <HabitCheck
        variant="icon"
        checked={done}
        disabled={pending}
        onChange={() => {
          onToggle();
          if (!done) onCelebrate?.();
        }}
        label={task.title}
      />
      <div className="flex-1 min-w-0">
        <motion.div
          className="text-sm font-medium"
          animate={{
            opacity: done ? 0.5 : 1,
            textDecorationLine: done ? "line-through" : "none",
          }}
          transition={{ duration: 0.22 }}
        >
          {task.title}
        </motion.div>
        {task.dueDate && (
          <div className="text-[10px] text-text3 font-mono">{task.dueDate}</div>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove} disabled={pending}>
        🗑
      </Button>
    </motion.li>
  );
}
