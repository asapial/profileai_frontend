"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";

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
  const [period, setPeriod] = useState("day");
  const pathname = usePathname();

  useEffect(() => {
    let interval = 0;
    let frame = 0;
    const root = document.documentElement;
    const update = () => {
      const now = new Date();
      const hour = now.getHours();
      setVariant(currentVariant());
      setPeriod(hour < 6 ? "night" : hour < 11 ? "morning" : hour < 17 ? "day" : hour < 21 ? "evening" : "night");
      root.style.setProperty("--studio-day-progress", String((hour * 60 + now.getMinutes()) / 1440));
    };
    const move = (event: PointerEvent) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--studio-pointer-x", `${(event.clientX / window.innerWidth - 0.5).toFixed(3)}`);
        root.style.setProperty("--studio-pointer-y", `${(event.clientY / window.innerHeight - 0.5).toFixed(3)}`);
      });
    };
    update();
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", update);

    const untilNextHour = 3_600_000 - (Date.now() % 3_600_000) + 100;
    const timeout = window.setTimeout(() => {
      update();
      interval = window.setInterval(update, 3_600_000);
    }, untilNextHour);

    return () => {
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", update);
      cancelAnimationFrame(frame);
      root.style.removeProperty("--studio-pointer-x");
      root.style.removeProperty("--studio-pointer-y");
    };
  }, []);

  const surface = pathname.startsWith("/dashboard/career")
    ? "career"
    : pathname.startsWith("/dashboard")
    ? "workspace"
    : pathname.startsWith("/admin")
      ? "admin"
      : pathname.startsWith("/login") || pathname.includes("password") || pathname === "/register" || pathname === "/verify-email"
        ? "auth"
        : "public";

  return (
    <div
      className="premium-hourly-background"
      data-background-variant={variant}
      data-day-period={period}
      data-surface={surface}
      aria-hidden="true"
    >
      <div className="premium-bg-base" />
      <div className="premium-bg-pattern" />
      <div className="premium-bg-aurora"><i /><i /></div>
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
      <div className="premium-bg-contours"><i /><i /><i /><i /></div>
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
