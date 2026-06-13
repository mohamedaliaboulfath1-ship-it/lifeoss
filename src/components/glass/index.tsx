"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  GLASS_BLUR,
  GLASS_GRADIENTS,
  GLASS_SEMANTIC,
  type GlassBlur,
  type GlassDomain,
  type GlassSemantic,
} from "@/lib/design/glass-tokens";
import { glassMotion } from "@/lib/motion/glass";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type GlassBaseProps = HTMLAttributes<HTMLDivElement> & {
  blur?: GlassBlur;
  domain?: GlassDomain;
  semantic?: GlassSemantic;
  lift?: boolean;
  glow?: boolean;
  reflect?: boolean;
};

function glassClasses({
  blur = "md",
  domain,
  semantic = "default",
  lift = false,
  glow = false,
  reflect = true,
  className,
}: GlassBaseProps & { className?: string }) {
  return cn(
    "liquid-glass relative overflow-hidden",
    GLASS_BLUR[blur],
    domain && GLASS_GRADIENTS[domain].className,
    semantic !== "default" && GLASS_SEMANTIC[semantic],
    lift && "glass-lift",
    glow && "glass-inner-glow",
    reflect && "glass-reflect",
    className
  );
}

/* ── GlassCard ── */
export const GlassCard = forwardRef<HTMLDivElement, GlassBaseProps>(
  ({ className, children, lift = true, ...props }, ref) => (
    <div ref={ref} className={glassClasses({ ...props, lift, className: cn("rounded-2xl", className) })}>
      <div className="glass-edge" aria-hidden />
      <div className="relative z-[1]">{children}</div>
    </div>
  )
);
GlassCard.displayName = "GlassCard";

/* ── GlassPanel ── */
export const GlassPanel = forwardRef<HTMLDivElement, GlassBaseProps>(
  ({ className, children, lift = false, blur = "lg", ...props }, ref) => (
    <div ref={ref} className={glassClasses({ ...props, blur, lift, className: cn("rounded-xl", className) })}>
      <div className="glass-edge" aria-hidden />
      <div className="relative z-[1]">{children}</div>
    </div>
  )
);
GlassPanel.displayName = "GlassPanel";

/* ── GlassWidget ── */
type GlassWidgetProps = GlassBaseProps & {
  title?: string;
  icon?: string;
  action?: ReactNode;
  delay?: number;
};

export function GlassWidget({
  title,
  icon,
  action,
  delay = 0,
  children,
  className,
  domain,
  ...props
}: GlassWidgetProps) {
  const reduced = useReducedMotion();
  const motionProps = reduced ? {} : glassMotion.cardUnfold(delay);

  return (
    <motion.div {...motionProps} className={cn("h-full", className)}>
      <GlassCard domain={domain} className="h-full flex flex-col" {...props}>
        {(title || icon) && (
          <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2 text-sm font-bold">
              {icon && <span className="text-base">{icon}</span>}
              {title}
            </div>
            {action}
          </div>
        )}
        <div className="flex-1 p-5">{children}</div>
      </GlassCard>
    </motion.div>
  );
}

/* ── GlassModal panel (content only — use inside MotionModal) ── */
export function GlassModal({
  children,
  className,
  ...props
}: GlassBaseProps) {
  const reduced = useReducedMotion();
  const motionProps = reduced ? {} : glassMotion.modalExpand;

  return (
    <motion.div {...motionProps} className={cn("w-full", className)}>
      <GlassCard blur="xl" lift={false} className="p-6" {...props}>
        {children}
      </GlassCard>
    </motion.div>
  );
}

/* ── GlassSidebar shell ── */
export const GlassSidebar = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <aside ref={ref} className={cn("glass-sidebar", className)} {...props}>
      <div className="glass-sidebar-reflect" aria-hidden />
      <div className="relative z-[1] flex flex-col h-full">{children}</div>
    </aside>
  )
);
GlassSidebar.displayName = "GlassSidebar";

/* ── GlassNavbar ── */
export const GlassNavbar = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <header ref={ref} className={cn("glass-navbar", className)} {...props}>
      <div className="glass-navbar-reflect" aria-hidden />
      <div className="relative z-[1] flex items-center justify-between w-full gap-3">
        {children}
      </div>
    </header>
  )
);
GlassNavbar.displayName = "GlassNavbar";

/* ── Animated glass card with hover ── */
type MotionGlassCardProps = GlassBaseProps & HTMLMotionProps<"div"> & { delay?: number };

export function MotionGlassCard({
  children,
  className,
  delay = 0,
  lift = true,
  ...props
}: MotionGlassCardProps) {
  const reduced = useReducedMotion();
  const unfold = glassMotion.cardUnfold(delay);
  const hover = lift && !reduced ? glassMotion.hoverLift : {};

  return (
    <motion.div
      {...(reduced ? {} : unfold)}
      {...hover}
      className={glassClasses({ ...props, lift: false, className: cn("rounded-2xl", className) })}
      style={{ transformPerspective: 1200 }}
    >
      <div className="glass-edge" aria-hidden />
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}

export { glassClasses, GLASS_GRADIENTS };
