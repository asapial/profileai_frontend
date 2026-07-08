import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProFile AI — Build a Job-Winning Resume with AI",
  description:
    "Create, tailor, score, and export a professional resume in minutes. AI generation, ATS scoring, premium templates, cover letters, and application tracking.",
  metadataBase: new URL("https://profileai.app"),
  openGraph: {
    title: "ProFile AI — Build a Job-Winning Resume with AI",
    description:
      "Create, tailor, score, and export a professional resume in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}