import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";

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
        {/* Providers (React Query + Toaster) sits above route trees so every
            page has a QueryClient available. Mount it once here rather than
            per-layout to avoid duplicate clients and HMR remount churn. */}
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}