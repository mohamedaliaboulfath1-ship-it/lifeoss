"use client";

import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion";
import { AppModal, type AppModalProps } from "@/components/ui/app-modal";
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

/** @deprecated Prefer AppModal — kept for backward compatibility */
export function MotionModal({
  open,
  children,
  onClose,
  title,
  size = "md",
}: {
  open: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  title?: string;
  size?: AppModalProps["size"];
}) {
  return (
    <AppModal open={open} onClose={onClose ?? (() => {})} title={title} size={size} lazy={false}>
      {children}
    </AppModal>
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
