"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";

/** Smooth only deliberate chapter jumps; ordinary scrolling stays native. */
export function JourneyLink(props: ComponentPropsWithoutRef<"a">) {
  function jump(event: MouseEvent<HTMLAnchorElement>) {
    props.onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank") return;
    const href = props.href;
    if (!href?.startsWith("#")) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    window.history.replaceState(window.history.state, "", href);
  }
  return <a {...props} onClick={jump} />;
}
