"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires `enterCount` each time the element scrolls into view (after leaving).
 * Use as animation key — play once per enter, not continuously while visible.
 */
export function useInViewEnter(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [enterCount, setEnterCount] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const wasInView = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInView(visible);
        if (visible && !wasInView.current) {
          setEnterCount((n) => n + 1);
        }
        wasInView.current = visible;
      },
      { threshold, rootMargin: "0px 0px -2% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, enterCount, isInView };
}
