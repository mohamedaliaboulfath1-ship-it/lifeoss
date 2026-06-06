"use client";

import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion";
import { motion as motionTokens } from "@/lib/design-system/tokens";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: motionTokens.normal, ease: motionTokens.ease }}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({
  children,
  className = "",
  ...props
}: HTMLMotionProps<"div"> & { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: motionTokens.fast } }}
      transition={{ duration: motionTokens.normal }}
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
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={motionTokens.spring}
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: motionTokens.normal, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { AnimatePresence, motion };
