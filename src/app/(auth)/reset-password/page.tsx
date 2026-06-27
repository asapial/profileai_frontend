'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import OtpInput from '@/components/ui/OtpInput';
import { useResetPassword } from '@/hooks/useAuth';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/validations';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const { resetPassword, loading, error } = useResetPassword();
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    const ok = await resetPassword(email, otp, data.newPassword, data.confirmPassword);
    if (!ok) return;
    toast.success('Password reset successfully!');
    router.push('/login');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Reset password</h1>
        <p className="text-zinc-400">
          Enter the code sent to <span className="text-purple-400">{email}</span>
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm text-red-400 border border-red-500/30"
          style={{ background: 'rgba(239,68,68,0.08)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="input-label text-center block mb-3">Verification Code</label>
          <OtpInput value={otp} onChange={setOtp} />
        </div>

        <div>
          <label className="input-label">New Password</label>
          <div className="relative">
            <input
              {...register('newPassword')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              className="input-field pr-12"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.newPassword && <p className="input-error">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label className="input-label">Confirm Password</label>
          <input {...register('confirmPassword')} type="password" placeholder="Repeat new password" className="input-field" />
          {errors.confirmPassword && <p className="input-error">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full" id="reset-password-btn">
          {loading ? <><Loader2 size={18} className="animate-spin" /> Resetting...</> : 'Reset Password'}
        </button>
      </form>

      <Link href="/login" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
        <ArrowLeft size={16} /> Back to login
      </Link>
    </div>
  );
}
