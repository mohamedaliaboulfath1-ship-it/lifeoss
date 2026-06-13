"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SIZE_CLASS = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export type AppModalSize = keyof typeof SIZE_CLASS;

export type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: string;
  size?: AppModalSize;
  children?: ReactNode;
  footer?: ReactNode;
  /** Built-in footer when onSave is provided */
  onSave?: () => void | Promise<void>;
  saveLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  saveDisabled?: boolean;
  /** Only mount children after first open (performance) */
  lazy?: boolean;
  className?: string;
};

export function AppModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = "lg",
  children,
  footer,
  onSave,
  saveLabel = "حفظ",
  cancelLabel = "إلغاء",
  saving = false,
  saveDisabled = false,
  lazy = true,
  className,
}: AppModalProps) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      trapFocus(e);
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose, trapFocus]);

  const showChildren = !lazy || hasOpened;
  const builtInFooter = onSave ? (
    <>
      <Button variant="ghost" onClick={onClose} disabled={saving}>
        {cancelLabel}
      </Button>
      <Button
        variant="gold"
        disabled={saveDisabled || saving}
        onClick={() => void onSave()}
      >
        {saving ? "جاري الحفظ..." : saveLabel}
      </Button>
    </>
  ) : null;
  const footerContent = footer ?? builtInFooter;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6"
          style={{ backdropFilter: "blur(12px)" }}
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={onClose}
          role="presentation"
        >
          <div className="absolute inset-0 bg-black/55" aria-hidden />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={reduced ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative z-[1] flex flex-col w-[95vw] max-h-[90vh] rounded-xl border border-border2",
              "bg-surface shadow-premium-lg glass-premium overflow-hidden",
              SIZE_CLASS[size],
              className
            )}
          >
            {(title || icon) && (
              <header className="shrink-0 px-5 py-4 border-b border-border/60 flex items-start gap-3">
                {icon && <span className="text-xl leading-none mt-0.5">{icon}</span>}
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 id={titleId} className="font-bold text-gold2 text-base">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-xs text-text3 mt-0.5">{subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-text3 hover:text-text text-lg leading-none px-2 py-1 rounded hover:bg-surface2"
                  aria-label="إغلاق"
                >
                  ×
                </button>
              </header>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0">
              {showChildren ? children : null}
            </div>

            {footerContent && (
              <footer className="shrink-0 sticky bottom-0 px-5 py-3 border-t border-border/60 bg-surface/95 backdrop-blur-sm flex gap-2 justify-end">
                {footerContent}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
