'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useRegister } from '@/hooks/useAuth';
import { registerSchema, type RegisterFormData } from '@/validations';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ['bg-zinc-700', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : 'bg-zinc-800'}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((c) => (
          <div key={c.label} className={`flex items-center gap-1 text-xs ${c.pass ? 'text-emerald-400' : 'text-zinc-500'}`}>
            <Check size={10} className={c.pass ? 'opacity-100' : 'opacity-0'} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, loading, error } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const watchedPassword = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    const result = await registerUser(data);
    if (!result) return;
    toast.success('Account created! Check your email for verification code.');
    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-zinc-400">Start building AI-powered resumes for free</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm text-red-400 border border-red-500/30"
          style={{ background: 'rgba(239,68,68,0.08)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">First name</label>
            <input {...register('firstName')} placeholder="Alex" className="input-field" />
            {errors.firstName && <p className="input-error">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="input-label">Last name</label>
            <input {...register('lastName')} placeholder="Johnson" className="input-field" />
            {errors.lastName && <p className="input-error">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="input-label">Email address</label>
          <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" />
          {errors.email && <p className="input-error">{errors.email.message}</p>}
        </div>

        <div>
          <label className="input-label">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              className="input-field pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <PasswordStrength password={watchedPassword} />
          {errors.password && <p className="input-error">{errors.password.message}</p>}
        </div>

        <div>
          <label className="input-label">Confirm password</label>
          <input {...register('confirmPassword')} type="password" placeholder="Repeat password" className="input-field" />
          {errors.confirmPassword && <p className="input-error">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2" id="register-submit-btn">
          {loading ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-400">
        Already have an account?{' '}
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
