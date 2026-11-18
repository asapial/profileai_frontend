import { AccessAuthScene as AuthScene } from "@/components/auth/AccessAuthScene";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { AuthFormFallback } from "@/components/auth/AuthFormFallback";

export const metadata: Metadata = {
  title: "Reset password — ProfileAI",
  description:
    "Enter the 6-digit code we emailed you and choose a new password for your ProfileAI account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthScene>
          <Suspense fallback={<AuthFormFallback title="Set a new password" description="Loading your secure reset form…" />}>
            <ResetPasswordForm />
          </Suspense>
    </AuthScene>
  );
}
