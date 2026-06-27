'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLogin } from '@/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/validations';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error, errorCode } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data.email, data.password);
    if (!result) return;

    if (result.twoFactorRequired) {
      router.push(`/login/2fa?email=${encodeURIComponent(result.email || data.email)}`);
      return;
    }

    // Store role in a non-httpOnly cookie for middleware
    if (result.user?.role) {
      document.cookie = `userRole=${result.user.role}; path=/; max-age=${7 * 24 * 3600}`;
    }

    toast.success('Welcome back!');
    router.push(result.user?.role === 'ADMIN' ? '/admin' : '/dashboard');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-zinc-400">Sign in to continue building your career</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl text-sm text-red-400 border border-red-500/30"
          style={{ background: 'rgba(239,68,68,0.08)' }}>
          {error}
          {errorCode === 'DEVICE_LIMIT_REACHED' && (
            <Link href="/profile?tab=devices" className="block mt-1 underline text-red-300">
              Manage your devices →
            </Link>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="input-label">Email address</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            className="input-field"
            autoComplete="email"
          />
          {errors.email && <p className="input-error">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="input-label" style={{ marginBottom: 0 }}>Password</label>
            <Link href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="input-field pr-12"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="input-error">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
          id="login-submit-btn"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
        </button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
          Create one free
        </Link>
      </p>
    </div>
  );
}
