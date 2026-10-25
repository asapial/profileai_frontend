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
      <main id="main" className="ax-page">
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
