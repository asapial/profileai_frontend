import { AuthScene } from "@/components/auth/AuthScene";
import { Suspense } from "react";
import { TwoFactorSetupForm } from "./TwoFactorSetupForm";

export const metadata = { title: "Set up two-factor authentication · ProfileAI" };

export default function TwoFactorSetupPage() {
  return (
    <main className="auth-page grid min-h-screen place-items-center bg-muted/30 py-10"><AuthScene>
      <Suspense fallback={<div className="h-80 w-full max-w-md animate-pulse rounded-2xl bg-muted" />}>
        <TwoFactorSetupForm />
      </Suspense>
    </AuthScene></main>
  );
}
