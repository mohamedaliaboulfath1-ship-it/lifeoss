"use client";

import { useSpring, animated } from "@react-spring/web";

export function CountUp({
  value,
  duration = 500,
  suffix = "",
  decimals = 0,
  className = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const spring = useSpring({
    val: value,
    config: {
      tension: 120,
      friction: 14,
      duration,
    },
  });

  return (
    <animated.span className={className}>
      {spring.val.to((v) => `${decimals > 0 ? v.toFixed(decimals) : Math.round(v)}${suffix}`)}
    </animated.span>
  );
}
