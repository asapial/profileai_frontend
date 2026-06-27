import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ProFile AI — AI-Powered Resume Builder',
    template: '%s | ProFile AI',
  },
  description:
    'Create professionally formatted, ATS-optimized resumes and CVs powered by OpenAI. Build your perfect resume in minutes.',
  keywords: ['resume builder', 'AI resume', 'ATS optimization', 'CV builder', 'career tools'],
  authors: [{ name: 'ProFile AI' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ProFile AI',
    title: 'ProFile AI — AI-Powered Resume Builder',
    description: 'Create professionally formatted, ATS-optimized resumes powered by AI.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#09090b] text-zinc-100 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#18181b',
              color: '#f4f4f5',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}
