"use client";

/** Google OAuth sign-in button.
 *  Clicking it redirects to the backend's Google OAuth flow.
 *  The backend initiates the consent screen and (after approval) returns
 *  a session cookie, then redirects the user to /dashboard.
 */

import { useState } from "react";
import { env } from "@/lib/env";

interface GoogleButtonProps {
  label?: string;
  disabled?: boolean;
}

export function GoogleButton({ label = "Continue with Google", disabled }: GoogleButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const handleClick = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch(`${env.apiBaseUrl.replace(/\/api\/v1$/, "")}/api/auth/sign-in/social`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", callbackURL: `${window.location.origin}/login?google=1`, errorCallbackURL: `${window.location.origin}/login?oauth_error=1` }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error("Google sign-in is unavailable. Please try again or use email.");
      window.location.assign(data.url);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not connect to Google."); setBusy(false); }
  };

  return (
    <>
    <button
      type="button"
      disabled={disabled || busy}
      onClick={handleClick}
      className="group relative inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:border-violet-400/50 hover:bg-card hover:shadow-md hover:shadow-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {/* Google "G" SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className="h-4 w-4 shrink-0"
        aria-hidden
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
        <path fill="none" d="M0 0h48v48H0z" />
      </svg>
      {busy ? "Connecting to Google…" : label}
    </button>
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </>
  );
}
