'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reveal-on-scroll hook. Returns a ref + boolean `visible`.
 *
 * Per Block 0 motion philosophy: 16px translate, 400ms ease, staggered
 * via CSS `transition-delay` on siblings. The global reduced-motion rule
 * zeros transition duration so this hook still flips `visible`
 * immediately on first render — content never gets trapped faded-out.
 *
 * Usage:
 *   const { ref, visible } = useReveal<HTMLDivElement>();
 *   <div ref={ref} className={cn('reveal', visible && 'is-visible')} />
 */
export function useReveal<T extends Element>(opts?: { rootMargin?: string; once?: boolean }) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  const once = opts?.once ?? true;

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { rootMargin: opts?.rootMargin ?? '0px 0px -10% 0px', threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, opts?.rootMargin]);

  return { ref, visible };
}