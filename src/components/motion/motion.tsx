"use client";

import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion";
import { modalBackdrop, modalPanel } from "@/lib/motion/modal";
import { cardEnter, cardHover } from "@/lib/motion/card";
import { MOTION } from "@/lib/motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: MOTION.distance.sm }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -MOTION.distance.sm / 2 }}
      transition={{ duration: MOTION.duration.normal, ease: MOTION.ease.out }}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({
  children,
  className = "",
  hover = true,
  ...props
}: HTMLMotionProps<"div"> & { children: React.ReactNode; hover?: boolean }) {
  return (
    <motion.div
      initial={cardEnter.initial}
      animate={cardEnter.animate}
      transition={cardEnter.transition}
      whileHover={hover ? cardHover : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionModal({
  open,
  children,
  onClose,
}: {
  open: boolean;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/55"
          {...modalBackdrop}
          onClick={onClose}
        >
          <motion.div
            {...modalPanel}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: MOTION.distance.sm / 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration.normal, delay, ease: MOTION.ease.out }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { AnimatePresence, motion };
