import { AccessAuthScene as AuthScene } from "@/components/auth/AccessAuthScene";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password — ProfileAI",
  description:
    "Reset your ProfileAI password. We'll email you a one-time code to confirm it's really you.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthScene>
          <ForgotPasswordForm />
    </AuthScene>
  );
}
