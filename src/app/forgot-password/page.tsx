import { AuthScene } from "@/components/auth/AuthScene";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalAuthFooter } from "@/components/auth/MinimalAuthFooter";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password — ProfileAI",
  description:
    "Reset your ProfileAI password. We'll email you a one-time code to confirm it's really you.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="ax-page">
        <AuthScene>
          <ForgotPasswordForm />
        </AuthScene>
      </main>
      <MinimalAuthFooter />
    </>
  );
}
