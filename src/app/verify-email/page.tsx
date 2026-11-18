import { AccessAuthScene as AuthScene } from "@/components/auth/AccessAuthScene";
import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailForm } from "./VerifyEmailForm";
import { AuthFormFallback } from "@/components/auth/AuthFormFallback";

export const metadata: Metadata = {
  title: "Verify your email — ProfileAI",
  description:
    "Enter the 6-digit code we sent to your email to finish creating your ProfileAI account.",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <AuthScene>
          <Suspense fallback={<AuthFormFallback title="Check your inbox" description="Loading email verification…" />}>
            <VerifyEmailForm />
          </Suspense>
    </AuthScene>
  );
}
