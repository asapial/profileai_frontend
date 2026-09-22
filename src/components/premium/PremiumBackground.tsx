"use client";

import { useEffect, useState, type CSSProperties } from "react";

const BACKGROUND_COUNT = 10;

const PARTICLES = [
  [8, 14, 7, 0], [18, 72, 5, -8], [29, 34, 9, -16], [42, 82, 6, -5],
  [53, 18, 4, -13], [64, 61, 8, -20], [76, 27, 5, -3], [88, 77, 7, -11],
  [95, 42, 4, -18], [12, 91, 5, -7], [34, 9, 4, -21], [47, 48, 6, -10],
  [58, 92, 5, -15], [71, 8, 7, -4], [83, 51, 4, -19], [23, 53, 5, -12],
] as const;

function currentVariant() {
  return Math.floor(Date.now() / 3_600_000) % BACKGROUND_COUNT;
}

export function PremiumBackground() {
  const [variant, setVariant] = useState(0);

  useEffect(() => {
    let interval = 0;
    const update = () => setVariant(currentVariant());
    update();

    const untilNextHour = 3_600_000 - (Date.now() % 3_600_000) + 100;
    const timeout = window.setTimeout(() => {
      update();
      interval = window.setInterval(update, 3_600_000);
    }, untilNextHour);

    return () => {
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="premium-hourly-background" data-background-variant={variant} aria-hidden="true">
      <div className="premium-bg-base" />
      <div className="premium-bg-pattern" />
      <div className="premium-bg-glow premium-bg-glow-a" />
      <div className="premium-bg-glow premium-bg-glow-b" />
      <div className="premium-bg-glow premium-bg-glow-c" />
      <div className="premium-bg-orbits">
        <i /><i /><i />
      </div>
      <div className="premium-bg-ribbons">
        <i /><i /><i />
      </div>
      <div className="premium-bg-horizon" />
      <div className="premium-bg-particles">
        {PARTICLES.map(([x, y, size, delay], index) => (
          <i
            key={index}
            style={{
              "--particle-x": `${x}%`,
              "--particle-y": `${y}%`,
              "--particle-size": `${size}px`,
              "--particle-delay": `${delay}s`,
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="premium-bg-grain" />
      <div className="premium-bg-vignette" />
    </div>
  );
}
