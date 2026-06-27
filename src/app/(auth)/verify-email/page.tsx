'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import OtpInput from '@/components/ui/OtpInput';
import { useVerifyEmail, useResendOtp } from '@/hooks/useAuth';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const { verifyEmail, loading, error } = useVerifyEmail();
  const { resendOtp, loading: resendLoading } = useResendOtp();
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = useCallback(() => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((c) => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
    }, 1000);
  }, []);

  useEffect(() => { startCooldown(); }, [startCooldown]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    const ok = await verifyEmail(email, otp);
    if (!ok) return;
    setVerified(true);
    toast.success('Email verified! Redirecting to login...');
    setTimeout(() => router.push('/login'), 3000);
  };

  useEffect(() => {
    if (otp.length === 6) handleVerify();
  }, [otp]);

  const handleResend = async () => {
    const ok = await resendOtp(email, 'EMAIL_VERIFY');
    if (ok) { toast.success('New code sent!'); startCooldown(); setOtp(''); }
  };

  if (verified) {
    return (
      <div className="text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>
          <CheckCircle size={40} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
          <p className="text-zinc-400">Your account is ready. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Verify your email</h1>
        <p className="text-zinc-400">
          We sent a 6-digit code to{' '}
          <span className="text-purple-400 font-medium">{email}</span>
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm text-red-400 border border-red-500/30"
          style={{ background: 'rgba(239,68,68,0.08)' }}>
          {error}
        </div>
      )}

      <OtpInput value={otp} onChange={setOtp} error={error || undefined} />

      <button onClick={handleVerify} disabled={loading || otp.length !== 6} className="btn-primary w-full" id="verify-email-btn">
        {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : 'Verify Email'}
      </button>

      <div className="text-center">
        {cooldown > 0 ? (
          <p className="text-sm text-zinc-500">
            Resend in <span className="text-purple-400 font-semibold">{cooldown}s</span>
          </p>
        ) : (
          <button onClick={handleResend} disabled={resendLoading}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5 mx-auto">
            <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}
