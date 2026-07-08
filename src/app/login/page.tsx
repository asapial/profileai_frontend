import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in — ProFile AI",
  description:
    "Log in to ProFile AI to keep building, tailoring, and exporting your AI-powered resume.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main
        id="main"
        className="relative isolate flex min-h-screen items-center justify-center overflow-hidden pt-24 pb-16"
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
          <LoginForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
