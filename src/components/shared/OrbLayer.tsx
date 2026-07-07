import { cn } from '@/lib/utils';

/**
 * OrbLayer — the signature frosted-glass floating orbs.
 *
 * Per Block 0 of the design prompt: orbs are the single most recognizable
 * motif and must feel AMBIENT, not mechanical. Each orb has an independent
 * drift animation with its own duration (8-11s) so they never sync.
 *
 * The "frosted glass" treatment is built from a multi-stop radial gradient
 * that fades to fully transparent at the edges, layered over the section's
 * --grad-hero navy. The optional grain overlay is the single detail that
 * takes dark hero surfaces from "flat CSS gradient" to "premium surface."
 *
 * Sections pass an array of orb specs. Orbs are pointer-events:none so
 * they never block interaction with the section content beneath.
 */
export type OrbSpec = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  /** diameter in px */
  size: number;
  /** drift variant — each uses a different keyframe with different timing */
  variant: 'a' | 'b' | 'c' | 'd';
  /** hue tilt — 'violet' (default, light purple) or 'navy' (rare, deepest) */
  tone?: 'violet' | 'navy';
  /** 0..1, default 0.55 */
  opacity?: number;
};

export function OrbLayer({
  orbs,
  className,
  withGrain = false,
}: {
  orbs?: OrbSpec[];
  className?: string;
  withGrain?: boolean;
}) {
  // If no orbs passed, fall back to the original 4-orb default so existing
  // callers don't have to think about props.
  const list =
    orbs ??
    ([
      { top: '-4rem', right: '8%', size: 220, variant: 'a' as const },
      { bottom: '12%', right: '18%', size: 120, variant: 'b' as const },
      { top: '18%', left: '10%', size: 60, variant: 'c' as const },
      { bottom: '-5rem', left: '18%', size: 180, variant: 'd' as const, tone: 'navy' as const },
    ] satisfies OrbSpec[]);

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {list.map((orb, i) => (
        <span
          key={i}
          className={cn('orb', `orb-drift-${orb.variant}`)}
          style={{
            top: orb.top,
            left: orb.left,
            right: orb.right,
            bottom: orb.bottom,
            width: orb.size,
            height: orb.size,
            opacity: orb.opacity ?? 0.55,
            background:
              orb.tone === 'navy'
                ? 'radial-gradient(circle at 35% 35%, rgba(124,58,237,0.32), rgba(11,11,31,0.05) 65%, transparent 75%)'
                : 'radial-gradient(circle at 35% 35%, rgba(196,181,253,0.55), rgba(124,58,237,0.22) 45%, rgba(167,139,250,0.06) 75%, transparent 90%)',
          }}
        />
      ))}
      {withGrain ? <GrainOverlay /> : null}
    </div>
  );
}

/**
 * Film-grain overlay. SVG turbulence at very low opacity, mix-blend overlay
 * so it sits on top of the gradient without darkening the whole image.
 * Subtle enough to not be obvious — the user only feels it as "this
 * surface is more designed than a flat CSS gradient."
 */
function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 mix-blend-overlay opacity-[0.035]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.85 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        backgroundSize: '220px 220px',
      }}
    />
  );
}
