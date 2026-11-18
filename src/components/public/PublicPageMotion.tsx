"use client";

import { useEffect } from "react";

/** Content is visible without JavaScript; the enhancement runs only on entry. */
export function PublicPageMotion() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting);
      entering.forEach((entry, index) => {
        observer.unobserve(entry.target);
        (entry.target as HTMLElement).style.setProperty("--public-entry-delay", `${Math.min(index, 3) * 55}ms`);
        entry.target.setAttribute("data-public-entered", "true");
      });
    }, { threshold: .08 });
    const root = document.querySelector("[data-public-page]");
    const observeContent = () => root?.querySelectorAll("[data-public-reveal]").forEach(element => {
      if (!seen.has(element)) { seen.add(element); observer.observe(element); }
    });
    observeContent();
    // Server streaming and live search can add content after the shell hydrates.
    const mutations = new MutationObserver(observeContent);
    if (root) mutations.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutations.disconnect(); };
  }, []);
  return null;
}
