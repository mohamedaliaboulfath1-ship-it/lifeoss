"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { pageMotion } from "@/lib/motion/page";
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
        initial={pageMotion.initial}
        animate={pageMotion.animate}
        exit={pageMotion.exit}
        transition={pageMotion.transition}
        className="flex-1 overflow-hidden flex flex-col min-w-0 will-change-transform"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
