"use client";

import { useSpring, animated } from "@react-spring/web";
import type { ReactNode } from "react";

/** Lightweight spring fade-in for sections — use alongside Framer Motion */
export function SpringFade({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const style = useSpring({
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0px)" },
    delay,
    config: { tension: 200, friction: 24 },
  });

  return (
    <animated.div style={style} className={className}>
      {children}
    </animated.div>
  );
}
