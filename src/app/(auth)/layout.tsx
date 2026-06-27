import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    default: 'ProFile AI',
    template: '%s | ProFile AI',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel (Branding) ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0d0d1a 0%, #130d2a 50%, #0d1a1a 100%)',
        }}>
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #6c63ff, transparent)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, #4ecdc4, transparent)' }} />
        </div>

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)' }}>
            P
          </div>
          <span className="text-xl font-bold text-white">ProFile AI</span>
        </Link>

        {/* Testimonial / Value Props */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Build resumes that{' '}
              <span className="gradient-text">land interviews</span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              AI-powered generation, ATS optimization, and stunning templates — everything you need to stand out.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '⚡', title: 'AI Generation', desc: 'Generate tailored resumes in seconds' },
              { icon: '🎯', title: 'ATS Optimized', desc: 'Beat applicant tracking systems' },
              { icon: '📄', title: 'PDF Export', desc: 'Download pixel-perfect PDFs instantly' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.25)' }}>
                  {item.icon}
                </div>
                <div>
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="text-sm text-zinc-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-zinc-600 text-sm">
          © {new Date().getFullYear()} ProFile AI. All rights reserved.
        </p>
      </div>

      {/* ── Right Panel (Auth Form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12"
        style={{ background: '#09090b' }}>
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)' }}>
              P
            </div>
            <span className="text-lg font-bold text-white">ProFile AI</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
