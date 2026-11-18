import type { CSSProperties, ReactNode } from "react";
import { Navbar1 } from "@/components/navbar1";
import { PublicPageMotion } from "./PublicPageMotion";
import { PublicFooter } from "./PublicFooter";
import { publicToneStyle } from "./public-tones";
import styles from "./PublicPages.module.css";

export type PublicRoom = "templates" | "pricing" | "help" | "privacy" | "terms" | "contact" | "billing-help";

/** Static physical rooms keep the pages light; all text and controls stay native. */
export function PublicEnvironment({ kind }: { kind: PublicRoom }) {
  const folder = kind === "contact" || kind === "billing-help" ? "/art/access-pages" : "/art/public-pages";
  return <div aria-hidden="true" data-public-environment={kind} data-room-fit={kind === "contact" || kind === "billing-help" ? "intrinsic" : undefined} className={styles.room} style={{
    "--room-light": `url(${folder}/${kind}-light.webp)`,
    "--room-dark": `url(${folder}/${kind}-dark.webp)`,
    "--room-light-mobile": `url(${folder}/${kind}-light-mobile.webp)`,
    "--room-dark-mobile": `url(${folder}/${kind}-dark-mobile.webp)`,
  } as CSSProperties} />;
}

export function PublicPageShell({ children, page }: { children: ReactNode; page: PublicRoom }) {
  return <div className={styles.shell} data-public-page={page} style={publicToneStyle(page)}>
    <PublicPageMotion />
    <Navbar1 />
    <main id="main">{children}</main>
    <PublicFooter />
  </div>;
}
