'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Count-up hook. Animates from `from` to `to` over `duration` ms with an
 * ease-out cubic curve. Starts when the element first scrolls into view.
 * Returns the current value (number) and a ref to attach.
 *
 * Respects prefers-reduced-motion by snapping directly to the final value.
 */
export function useCountUp(
  to: number,
  options?: { from?: number; duration?: number; decimals?: number; rootMargin?: string }
) {
  const ref = useRef<HTMLElement | null>(null);
  const [value, setValue] = useState(options?.from ?? 0);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            observer.disconnect();
            animate();
          }
        }
      },
      { threshold: 0.4, rootMargin: options?.rootMargin }
    );

    observer.observe(node);

    function animate() {
      const from = options?.from ?? 0;
      const duration = options?.duration ?? 1200;
      const decimals = options?.decimals ?? 0;

      // Reduced motion → snap.
      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        setValue(parseFloat(to.toFixed(decimals)));
        return;
      }

      const start = performance.now();
      function frame(now: number) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = from + (to - from) * eased;
        setValue(parseFloat(current.toFixed(decimals)));
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    return () => observer.disconnect();
  }, [to, options?.from, options?.duration, options?.decimals, options?.rootMargin]);

  return { ref, value };
}