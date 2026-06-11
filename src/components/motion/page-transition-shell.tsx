"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UNFOLD } from "@/lib/motion/unfold";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function PageTransitionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className="flex-1 overflow-hidden flex flex-col min-w-0">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={UNFOLD.page.initial}
        animate={UNFOLD.page.animate}
        exit={UNFOLD.page.exit}
        transition={UNFOLD.page.transition}
        className="flex-1 overflow-hidden flex flex-col min-w-0 will-change-transform"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
