import { AuthScene } from "@/components/auth/AuthScene";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalAuthFooter } from "@/components/auth/MinimalAuthFooter";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create your account — ProfileAI",
  description:
    "Sign up for ProfileAI and start building AI-powered resumes tailored to every job in minutes.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="ax-page">
        <AuthScene>
          <RegisterForm />
        </AuthScene>
      </main>
      <MinimalAuthFooter />
    </>
  );
}
