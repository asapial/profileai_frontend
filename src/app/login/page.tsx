import { AccessAuthScene as AuthScene } from "@/components/auth/AccessAuthScene";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in — ProfileAI",
  description:
    "Log in to ProfileAI to keep building, tailoring, and exporting your AI-powered resume.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthScene>
          <LoginForm />
    </AuthScene>
  );
}
