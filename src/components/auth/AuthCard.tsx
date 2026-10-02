"use client";

import Image from "next/image";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return <div className={`auth-surface animate-auth-card-enter ${className ?? ""}`}>
    <div className="auth-form-panel">{children}</div>
  </div>;
}

/** Reusable brand mark — ProfileAI logo + name */
export function AuthBrandMark() {
  return (
    <div className="mb-6 flex items-center gap-2">
      <Image src="/brand/profileai-mark.svg" alt="" width={38} height={38} className="auth-brand-mark" priority />
      <span className="text-lg font-semibold tracking-tight">ProfileAI</span>
    </div>
  );
}
