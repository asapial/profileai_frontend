"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import styles from "./PublicBrand.module.css";

export function AuthSiteHeader() {
  const { setTheme } = useTheme();
  return <header className={styles.compactHeader} data-site-header>
    <div className={styles.headerInner}>
      <Link href="/" className={styles.brand}><span className={styles.logoMount}><Image src="/brand/profileai-mark.svg" alt="" width={42} height={42} priority/></span><span>ProfileAI</span></Link>
      <div className={styles.headerActions}><Link href="/" className={styles.backHome}><ArrowLeft size={15} aria-hidden/><span>Back to home</span></Link><button type="button" className={styles.themeButton} aria-label="Toggle color theme" onClick={()=>setTheme(document.documentElement.classList.contains("dark")?"light":"dark")}><Moon className={styles.moon} size={19} aria-hidden/><Sun className={styles.sun} size={19} aria-hidden/></button></div>
    </div>
  </header>;
}
