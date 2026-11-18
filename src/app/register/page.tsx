import { AccessAuthScene as AuthScene } from "@/components/auth/AccessAuthScene";
import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create your account — ProfileAI",
  description:
    "Sign up for ProfileAI and start building AI-powered resumes tailored to every job in minutes.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <AuthScene>
          <RegisterForm />
    </AuthScene>
  );
}
