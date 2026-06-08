"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight, self-contained "has this element entered the viewport yet"
 * hook built on a native IntersectionObserver. More reliable than mixing
 * framer-motion's useInView with components that also re-render on resize.
 *
 * Includes two safety nets so a chart is NEVER left blank:
 *  - if the viewport is degenerate (innerHeight <= 0, e.g. some headless
 *    environments) it draws immediately, and
 *  - a fallback timer forces a draw if the observer hasn't fired in time.
 */
export function useInViewOnce<T extends Element>(rootMargin = "-60px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const vh =
      typeof window !== "undefined" ? window.innerHeight : 0;

    // Already visible on mount, or a degenerate viewport → draw now.
    const r = el.getBoundingClientRect();
    if (vh <= 0 || (r.top < vh && r.bottom > 0)) {
      setInView(true);
      return;
    }

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setInView(true);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          obs.disconnect();
        }
      },
      { rootMargin }
    );
    obs.observe(el);

    // Safety net: never stay blank if the observer never fires.
    const fallback = window.setTimeout(reveal, 2500);

    return () => {
      obs.disconnect();
      window.clearTimeout(fallback);
    };
  }, [inView, rootMargin]);

  return { ref, inView };
}
