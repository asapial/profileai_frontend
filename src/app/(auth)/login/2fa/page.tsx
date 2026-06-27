'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import OtpInput from '@/components/ui/OtpInput';
import { useTwoFactor, useResendOtp } from '@/hooks/useAuth';

export default function TwoFactorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const { verifyTwoFactor, loading, error } = useTwoFactor();
  const { resendOtp, loading: resendLoading } = useResendOtp();
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = useCallback(() => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => { startCooldown(); }, [startCooldown]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    const result = await verifyTwoFactor(email, otp);
    if (!result) return;

    if (result.user?.role) {
      document.cookie = `userRole=${result.user.role}; path=/; max-age=${7 * 24 * 3600}`;
    }
    toast.success('Login successful!');
    router.push(result.user?.role === 'ADMIN' ? '/admin' : '/dashboard');
  };

  const handleResend = async () => {
    const ok = await resendOtp(email, 'TWO_FACTOR');
    if (ok) { toast.success('New OTP sent!'); startCooldown(); }
  };

  useEffect(() => {
    if (otp.length === 6) handleVerify();
  }, [otp]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Two-factor auth</h1>
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

      <button
        onClick={handleVerify}
        disabled={loading || otp.length !== 6}
        className="btn-primary w-full"
        id="2fa-verify-btn"
      >
        {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : 'Verify Code'}
      </button>

      <div className="text-center">
        {cooldown > 0 ? (
          <p className="text-sm text-zinc-500">
            Resend code in <span className="text-purple-400 font-semibold">{cooldown}s</span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}
