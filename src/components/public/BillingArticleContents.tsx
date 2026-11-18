"use client";

import { useEffect, useState } from "react";
import styles from "./AccessPages.module.css";

export function BillingArticleContents({ sections }: { sections: { id: string; title: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const first = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (first) setActive(first.target.id);
    }, { rootMargin: "-100px 0px -45% 0px", threshold: 0 });
    sections.forEach(section => { const node = document.getElementById(section.id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, [sections]);
  return <nav className={styles.contents} aria-label="On this page">
    {sections.map(section => <a key={section.id} href={"#" + section.id} onClick={() => setActive(section.id)} aria-current={active === section.id ? "location" : undefined}>{section.title}</a>)}
  </nav>;
}
