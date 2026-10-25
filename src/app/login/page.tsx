import { AuthScene } from "@/components/auth/AuthScene";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalAuthFooter } from "@/components/auth/MinimalAuthFooter";
import { LoginForm } from "./LoginForm";
import { AuthFormFallback } from "@/components/auth/AuthFormFallback";

export const metadata: Metadata = {
  title: "Log in — ProfileAI",
  description:
    "Log in to ProfileAI to keep building, tailoring, and exporting your AI-powered resume.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="ax-page">
        <AuthScene>
          <Suspense
            fallback={
              <AuthFormFallback
                title="Welcome back"
                description="Loading your secure sign-in form…"
              />
            }
          >
            <LoginForm />
          </Suspense>
        </AuthScene>
      </main>
      <MinimalAuthFooter />
    </>
  );
}
