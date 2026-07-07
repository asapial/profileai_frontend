'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true when the user has requested reduced motion at the OS level.
 * Updates live if the user toggles the preference mid-session.
 *
 * The single big orchestrated animation moment (AnimatedCtaSection) uses
 * this to skip the convergence entirely and just reveal the final shape.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  return reduced;
}