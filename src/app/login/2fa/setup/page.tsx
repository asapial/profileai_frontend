import { Suspense } from "react";
import { TwoFactorSetupForm } from "./TwoFactorSetupForm";

export const metadata = { title: "Set up two-factor authentication · ProfileAI" };

export default function TwoFactorSetupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 px-4 py-10">
      <Suspense fallback={<div className="h-80 w-full max-w-md animate-pulse rounded-2xl bg-muted" />}>
        <TwoFactorSetupForm />
      </Suspense>
    </main>
  );
}
