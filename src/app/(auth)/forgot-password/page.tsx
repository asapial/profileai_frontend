'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useForgotPassword } from '@/hooks/useAuth';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/validations';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, loading, error } = useForgotPassword();
  const [sent, setSent] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const ok = await forgotPassword(data.email);
    if (!ok) return;
    setEmailSentTo(data.email);
    setSent(true);
    toast.success('Reset code sent!');
    setTimeout(() => {
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Forgot password?</h1>
        <p className="text-zinc-400">Enter your email to receive a reset code</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm text-red-400 border border-red-500/30"
          style={{ background: 'rgba(239,68,68,0.08)' }}>
          {error}
        </div>
      )}

      {sent ? (
        <div className="p-5 rounded-xl border border-emerald-500/30 space-y-2"
          style={{ background: 'rgba(16,185,129,0.08)' }}>
          <p className="text-emerald-400 font-semibold">Code sent!</p>
          <p className="text-sm text-zinc-400">
            We sent a reset code to <span className="text-white">{emailSentTo}</span>.
            Redirecting you to reset your password...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="input-label">Email address</label>
            <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" />
            {errors.email && <p className="input-error">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full" id="forgot-password-btn">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : 'Send Reset Code'}
          </button>
        </form>
      )}

      <Link href="/login" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
        <ArrowLeft size={16} /> Back to login
      </Link>
    </div>
  );
}
