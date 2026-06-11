"use client";

import { useSpring, animated } from "@react-spring/web";
import { useInViewEnter } from "@/hooks/use-in-view-enter";

export function CountUp({
  value,
  duration = 500,
  suffix = "",
  decimals = 0,
  className = "",
  playOnView = true,
  playKey,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
  className?: string;
  playOnView?: boolean;
  playKey?: number;
}) {
  const inView = useInViewEnter(0.08);
  const effectiveKey = playKey ?? (playOnView ? inView.enterCount : 1);

  const spring = useSpring({
    from: { val: 0 },
    to: { val: value },
    immediate: effectiveKey === 0,
    reset: true,
    config: {
      tension: 120,
      friction: 14,
      duration,
    },
    key: `${effectiveKey}-${value}`,
  });

  const content = (
    <animated.span>
      {spring.val.to(
        (v) => `${decimals > 0 ? v.toFixed(decimals) : Math.round(v)}${suffix}`
      )}
    </animated.span>
  );

  if (playOnView && playKey == null) {
    return (
      <span ref={inView.ref} className={className}>
        {content}
      </span>
    );
  }

  return <span className={className}>{content}</span>;
}
