import type { Metadata } from "next";
import "./globals.css";
import "./auth-experience.css";
import "./premium-background.css";
import "./glass-system.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import { StudioMotion } from "@/components/premium/StudioMotion";
import { PremiumBackground } from "@/components/premium/PremiumBackground";

export const metadata: Metadata = {
  title: "ProfileAI — A studio for your next chapter",
  description:
    "Create, tailor, score, and export a professional resume in minutes. AI generation, ATS scoring, premium templates, cover letters, and application tracking.",
  metadataBase: new URL("https://profileai.app"),
  openGraph: {
    title: "ProfileAI — A studio for your next chapter",
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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="studio-ui min-h-svh font-sans antialiased">
        {/* Providers (React Query + Toaster) sits above route trees so every
            page has a QueryClient available. Mount it once here rather than
            per-layout to avoid duplicate clients and HMR remount churn. */}
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider delayDuration={150}>
              <PremiumBackground />
              <StudioMotion>
                <div className="relative z-10 min-h-svh">{children}</div>
              </StudioMotion>
            </TooltipProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
