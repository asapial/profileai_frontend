"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import AOS from "aos";
import { gsap } from "gsap";

export function StudioMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Delay AOS slightly to allow React 19 streaming hydration to complete cleanly
    const timer = setTimeout(() => {
      AOS.init({
        duration: 600,
        once: true,
        offset: 45,
        disable: () => media.matches,
      });
      AOS.refresh();
    }, 100);

    const context = gsap.context(() => {
      if (!media.matches && root.current) {
        const targets = root.current.querySelectorAll(".studio-hero-copy > *");
        if (targets.length > 0) {
          gsap.fromTo(
            targets,
            { y: 22 },
            {
              y: 0,
              duration: 0.85,
              stagger: 0.08,
              ease: "power3.out",
              clearProps: "transform",
            },
          );
        }
      }
    }, root);

    return () => {
      clearTimeout(timer);
      context.revert();
    };
  }, [pathname]);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={root}>{children}</div>
    </MotionConfig>
  );
}
