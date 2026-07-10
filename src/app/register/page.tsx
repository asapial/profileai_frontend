import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create your account — ProFile AI",
  description:
    "Sign up for ProFile AI and start building AI-powered resumes tailored to every job in minutes.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main
        id="main"
        className="relative isolate flex min-h-svh items-center justify-center overflow-hidden pb-10 pt-20 sm:pb-16 sm:pt-24"
      >
        {/* Decorative gradient background + soft mesh grid */}
        <div className="bg-hero absolute inset-0 -z-10" aria-hidden />
        <div className="bg-mesh absolute inset-0 -z-10 opacity-60" aria-hidden />
        <div
          aria-hidden
          className="absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-400/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 right-1/4 -z-10 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl"
        />

        <div className="mx-auto w-full max-w-md px-4 sm:px-6">
          <Suspense fallback={null}>
            <RegisterForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
