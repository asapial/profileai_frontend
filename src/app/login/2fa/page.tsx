import { AuthScene } from "@/components/auth/AuthScene";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalAuthFooter } from "@/components/auth/MinimalAuthFooter";
import { TwoFactorForm } from "./TwoFactorForm";

export const metadata: Metadata = {
  title: "Verify it's you — ProfileAI",
  description: "Enter the verification code we sent to your email.",
  robots: { index: false, follow: false },
};

export default function TwoFactorPage() {
  return (
    <>
      <Navbar />
      <main
        id="main"
        className="auth-page relative isolate flex min-h-[calc(100svh-5rem)] items-center justify-center overflow-hidden py-12 sm:py-16"
      >
        <div className="bg-hero absolute inset-0 -z-10" aria-hidden />
        <div
          className="bg-mesh absolute inset-0 -z-10 opacity-60"
          aria-hidden
        />
        <div
          aria-hidden
          className="absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-400/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 right-1/4 -z-10 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl"
        />

        <AuthScene>
          <Suspense fallback={null}>
            <TwoFactorForm />
          </Suspense>
        </AuthScene>
      </main>
      <MinimalAuthFooter />
    </>
  );
}
