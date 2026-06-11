import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-sm font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-ring transform-gpu",
  {
    variants: {
      variant: {
        ghost:
          "bg-transparent text-text2 border border-border hover:bg-surface2 hover:text-text hover:border-border2",
        gold: "bg-gradient-to-br from-gold via-gold2 to-sky text-[#1a1e26] font-bold hover:opacity-90 border-0 shadow-premium",
        danger: "bg-rose/15 text-rose2 border border-rose/30 hover:bg-rose/25",
      },
      size: {
        sm: "px-2.5 py-1 text-[11px]",
        md: "px-3.5 py-1.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  }
);

export const cardVariants = cva(
  "bg-surface/90 border border-border/60 rounded-2xl overflow-hidden shadow-premium transition-all duration-300 ease-out hover:border-border2/80 hover:shadow-premium-lg hover:-translate-y-px",
  {
    variants: {
      animate: {
        true: "animate-in fade-in-0 zoom-in-95 duration-300",
        false: "",
      },
    },
    defaultVariants: {
      animate: false,
    },
  }
);

export const kpiVariants = cva(
  "bg-surface border border-border rounded-[10px] p-[18px] relative overflow-hidden shadow-premium group transition-all duration-200 hover:border-border2 hover:shadow-premium hover:-translate-y-0.5",
  {
    variants: {
      animate: {
        true: "animate-in fade-in-0 slide-in-from-bottom-2 duration-500",
        false: "",
      },
    },
    defaultVariants: {
      animate: true,
    },
  }
);
