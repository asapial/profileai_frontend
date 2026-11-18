"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthPuppet } from "./AuthPuppet";
import { AuthSiteHeader } from "../public/AuthSiteHeader";
import { PublicFooter } from "../public/PublicFooter";
import { publicToneStyle } from "../public/public-tones";
import styles from "./AccessAuthScene.module.css";

/** The approved room surrounds the original forms; authentication stays in those forms. */
export function AccessAuthScene({ children }: { children: ReactNode }) {
  const path = usePathname();
  const kind = path === "/register" ? "register" : path === "/reset-password" ? "reset" : path === "/verify-email" ? "verify" : path === "/forgot-password" ? "forgot" : "login";
  const animated = kind === "login" || kind === "register" || kind === "reset";
  const art = kind === "login" ? "login-room" : animated ? "puppet-room" : kind;
  const caption = kind === "register" ? "Start with your story." : kind === "verify" ? "One step to your workspace." : kind === "forgot" || kind === "reset" ? "A fresh start." : "Your next move.";
  return <div className={styles.shell} data-auth-page={kind} style={publicToneStyle(kind)}>
    <a href="#main" className={styles.skipLink}>Skip to content</a>
    <AuthSiteHeader />
    <main id="main" className={styles.layout}>
      <figure className={styles.art} aria-hidden="true" data-auth-art={kind}>
        <div className={styles.room} data-auth-room style={{ "--room-light": "url(/art/access-pages/" + art + "-light.webp)", "--room-dark": "url(/art/access-pages/" + art + "-dark.webp)", "--room-light-mobile": "url(/art/access-pages/" + art + "-light-mobile.webp)", "--room-dark-mobile": "url(/art/access-pages/" + art + "-dark-mobile.webp)" } as CSSProperties} />
        {animated && <AuthPuppet />}
        <figcaption className={styles.caption}>{caption}</figcaption>
      </figure>
      <div className={styles.formSide}>{children}</div>
    </main>
    <PublicFooter compact withCTA={false} />
  </div>;
}
