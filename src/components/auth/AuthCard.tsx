"use client";

import { AuthStudioBrand } from "./AuthScene";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div className={`ax-form-panel ${className ?? ""}`}>
      {children}
    </div>
  );
}

/** Reusable brand mark — ProfileAI wordmark with a studio note. */
export function AuthBrandMark({ note }: { note?: string }) {
  return <AuthStudioBrand note={note} />;
}
