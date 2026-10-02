"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
  type SVGMotionProps,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

const easeEmphasized = [0.16, 1, 0.3, 1] as const;

export function useMotionPreference() {
  const reduced = useReducedMotion();
  const [touch, setTouch] = useState(true);
  useEffect(() => setTouch(window.matchMedia("(pointer: coarse)").matches), []);
  return { reduced: Boolean(reduced), touch, allowTilt: !reduced && !touch };
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: reduced ? 0 : 0.4, delay, ease: easeEmphasized }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : 0.05, staggerDirection: 1 } } }}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeEmphasized } },
};

export function TiltCard({ children, className, maxTilt = 5, ...props }: HTMLMotionProps<"div"> & { maxTilt?: number }) {
  const { allowTilt } = useMotionPreference();
  const rotateX = useSpring(useMotionValue(0), { stiffness: 260, damping: 28, mass: 0.9 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 260, damping: 28, mass: 0.9 });
  return (
    <motion.div
      {...props}
      className={className}
      style={{ ...props.style, rotateX, rotateY, transformStyle: "preserve-3d" }}
      onPointerMove={(event) => {
        props.onPointerMove?.(event);
        if (!allowTilt) return;
        const box = event.currentTarget.getBoundingClientRect();
        rotateY.set(((event.clientX - box.left) / box.width - 0.5) * maxTilt * 2);
        rotateX.set(-((event.clientY - box.top) / box.height - 0.5) * maxTilt * 2);
      }}
      onPointerLeave={(event) => {
        props.onPointerLeave?.(event);
        rotateX.set(0);
        rotateY.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function PerspectiveStage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className} style={{ perspective: "var(--perspective, 1200px)" }}>{children}</div>;
}

export function ThreadLine(props: SVGMotionProps<SVGPathElement>) {
  const reduced = useReducedMotion();
  return (
    <motion.path
      {...props}
      initial={reduced ? false : { pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduced ? 0 : 0.8, ease: easeEmphasized }}
    />
  );
}

export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduced) { ref.current.textContent = Math.round(value).toLocaleString(); return; }
    const controls = animate(0, value, {
      duration: 0.7,
      ease: easeEmphasized,
      onUpdate: (latest) => { if (ref.current) ref.current.textContent = Math.round(latest).toLocaleString(); },
    });
    return controls.stop;
  }, [inView, reduced, value]);
  return <span ref={ref} className={className}>{reduced ? Math.round(value).toLocaleString() : "0"}</span>;
}

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.24, ease: easeEmphasized }}>
      {children}
    </motion.div>
  );
}
