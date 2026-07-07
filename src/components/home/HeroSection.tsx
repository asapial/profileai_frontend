'use client';

import { useEffect, useRef, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrbLayer } from '@/components/shared/OrbLayer';
import { Badge } from '@/components/ui/badge';
import { SmartCta } from '@/components/ui/smart-cta';
import { useCountUp } from '@/hooks/use-count-up';

/**
 * HeroSection — Block 2. The thesis of the whole page.
 *
 * Asymmetric 45/55 split. Left: eyebrow + Fraunces headline + body +
 * CTAs + mono trust line. Right: a floating glass resume card running a
 * 4-second live document-transformation loop:
 *
 *   1. Plain weak bullet in muted grey (1.4s)
 *   2. Accent scan-line sweeps down (0.7s)
 *   3. Bullet character-morphs into a strong, quantified line (1.0s)
 *   4. ATS score chip ticks 61 → 94, color amber → accent purple
 *   5. Hold + cross-fade back
 *
 * Two orbs behind the card at different depths with subtle mouse parallax.
 * Dark section → full orb treatment, grain overlay included.
 */
export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden bg-[--grad-hero] pt-[88px] lg:pt-[112px]"
    >
      <OrbLayer
        withGrain
        orbs={[
          { top: '-10%', left: '-6%', size: 460, variant: 'a', opacity: 0.55 },
          { top: '20%', right: '8%', size: 320, variant: 'b', opacity: 0.45 },
          { bottom: '-12%', left: '30%', size: 380, variant: 'c', opacity: 0.5 },
        ]}
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 pb-24 pt-16 lg:grid-cols-[45fr_55fr] lg:gap-10 lg:px-8 lg:pb-32 lg:pt-20">
        <HeroCopy />
        <HeroDemo />
      </div>
    </section>
  );
}

function HeroCopy() {
  return (
    <div className="flex flex-col justify-center">
      <Badge className="self-start">AI-Powered Resume Builder</Badge>

      <h1 className="text-display mt-6 text-white">
        Turn career <em className="not-italic text-[--color-accent]">chaos</em>
        <br className="hidden sm:block" /> into an interview-ready
        <br className="hidden sm:block" /> resume.
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
        Drop in your messy career facts. ProFile AI rewrites them into
        quantified, ATS-scored bullets and lays them out in a template
        that recruiters actually finish reading.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <SmartCta
          href="/register"
          label="Build my resume"
          size="lg"
          analyticsLabel="hero_primary"
        />
        <a
          href="#how-it-works"
          className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
        >
          <PlayCircle
            size={20}
            className="text-[--color-accent] transition-transform group-hover:scale-110"
          />
          See how it works
        </a>
      </div>

      <p className="mt-6 font-mono text-[13px] text-white/55">
        <span className="text-white/80">12,400+</span> resumes generated ·
        <span className="ml-2 text-white/80">+34pts</span> avg ATS lift ·
        <span className="ml-2 text-white/80">48hrs</span> to first callback
      </p>
    </div>
  );
}

function HeroDemo() {
  // ATS score chip — counts up to 94 once the morph begins.
  const { ref, value } = useCountUp(94, { duration: 1500, from: 61 });
  const score = Math.round(value);
  const scoreColor =
    score < 70 ? 'text-amber-300' : score < 85 ? 'text-[#c4b5fd]' : 'text-[--color-accent]';

  return (
    <div className="relative flex items-center justify-center lg:justify-end">
      <ParallaxOrbs />

      <div
        className={cn(
          'glass-surface relative w-full max-w-[520px] -rotate-[2deg]',
          'p-7 shadow-[0_30px_80px_-30px_rgba(124,58,237,0.55)]',
          'transition-transform duration-500 hover:rotate-0'
        )}
      >
        <div className="absolute -top-3 -right-3 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(13,13,26,0.85)] px-3 py-1.5 shadow-lg backdrop-blur-md">
          <span className="font-mono text-[11px] uppercase tracking-wider text-white/60">
            ATS
          </span>
          <span
            ref={ref as React.Ref<HTMLSpanElement>}
            className={cn('font-mono text-sm font-semibold transition-colors duration-300', scoreColor)}
          >
            {score}
          </span>
        </div>

        <div className="mb-4">
          <div className="font-display text-xl text-white">Maya Okonkwo</div>
          <div className="text-xs text-white/55">Senior Product Designer · 6 yrs</div>
        </div>

        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
          Experience
        </div>

        <BulletMorph />

        <div className="mt-5 space-y-1.5">
          <div className="h-1.5 w-[78%] rounded-full bg-white/10" />
          <div className="h-1.5 w-[64%] rounded-full bg-white/10" />
          <div className="h-1.5 w-[86%] rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

/**
 * BulletMorph — the 4-second live demonstration.
 * Phases: weak → scan-line sweep → character-by-character morph → strong → reset.
 */
function BulletMorph() {
  const weak = 'Worked on team projects and helped with tasks.';
  const strong = 'Led a 5-person team to ship 3 features that lifted retention by 22%.';

  type Phase = 'weak' | 'scanning' | 'morph' | 'strong';
  const [phase, setPhase] = useState<Phase>('weak');
  const [morphIndex, setMorphIndex] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Respect reduced motion: render the strong bullet statically.
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setPhase('strong');
      setMorphIndex(strong.length);
      return;
    }

    const loop = () => {
      setPhase('weak');
      setMorphIndex(0);
      const t1 = setTimeout(() => setPhase('scanning'), 1400);
      const t2 = setTimeout(() => setPhase('morph'), 2100);
      const t3 = setTimeout(() => setPhase('strong'), 3100);
      const t4 = setTimeout(loop, 4100);

      // Character-by-character morph with ease-out cubic.
      const start = performance.now() + 100;
      let raf = 0;
      const tick = (now: number) => {
        const elapsed = now - start;
        if (elapsed < 0) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const ratio = Math.min(1, elapsed / 1000);
        const eased = 1 - Math.pow(1 - ratio, 3);
        setMorphIndex(Math.floor(eased * strong.length));
        if (ratio < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      cleanupRef.current = () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        cancelAnimationFrame(raf);
      };
    };
    loop();
    return () => cleanupRef.current?.();
  }, [strong.length]);

  return (
    <div className="relative min-h-[58px]">
      <p
        className={cn(
          'relative text-[14px] leading-relaxed transition-colors duration-300',
          phase === 'weak' || phase === 'scanning'
            ? 'italic text-white/45'
            : 'text-white'
        )}
      >
        {phase === 'strong'
          ? strong
          : phase === 'morph'
            ? strong.slice(0, morphIndex)
            : weak}
        {phase === 'scanning' || phase === 'morph' ? (
          <span
            className="pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[--color-accent] to-transparent opacity-90"
            style={{
              animation: 'scan-line 0.7s linear forwards',
              top: phase === 'morph' ? '60%' : '50%',
            }}
          />
        ) : null}
      </p>
    </div>
  );
}

/** Two orbs at different depths, with subtle mouse parallax. */
function ParallaxOrbs() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setPos({ x: (e.clientX - cx) / cx, y: (e.clientY - cy) / cy });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return (
    <>
      <span
        className="orb orb-drift-a"
        style={{
          top: '-20%',
          right: '-10%',
          width: 280,
          height: 280,
          opacity: 0.5,
          transform: `translate(${pos.x * 18}px, ${pos.y * 14}px)`,
          background:
            'radial-gradient(circle at 35% 35%, rgba(196,181,253,0.6), rgba(124,58,237,0.25) 45%, transparent 75%)',
        }}
        aria-hidden
      />
      <span
        className="orb orb-drift-c"
        style={{
          bottom: '-25%',
          left: '-15%',
          width: 200,
          height: 200,
          opacity: 0.4,
          transform: `translate(${pos.x * 10}px, ${pos.y * 8}px)`,
          background:
            'radial-gradient(circle at 50% 50%, rgba(167,139,250,0.5), rgba(124,58,237,0.2) 50%, transparent 80%)',
        }}
        aria-hidden
      />
    </>
  );
}
