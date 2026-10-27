import { AuthScene } from "@/components/auth/AuthScene";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalAuthFooter } from "@/components/auth/MinimalAuthFooter";
import { LoginForm } from "./LoginForm";

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
          <LoginForm />
        </AuthScene>
      </main>
      <MinimalAuthFooter />
    </>
  );
}
