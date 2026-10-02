import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import "../styles/surfaces.css";
import "../styles/tokens.css";
import "../styles/base.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import { RouteVisuals } from "@/components/premium/RouteVisuals";

const uiFont = Geist({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

const displayFont = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
  display: "swap",
});

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
      <body className={`${uiFont.variable} ${displayFont.variable} studio-ui min-h-svh font-sans antialiased`}>
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
              <RouteVisuals />
              <div className="relative z-10 min-h-svh">{children}</div>
            </TooltipProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
