'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { loginSchema, type LoginValues } from '@/lib/validations';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/errors';
import { useAuth } from '@/store/auth';
import { dashboardPathForRole } from '@/types/auth';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '';
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      const res = await api.post('/auth/login', values);
      const { user, accessToken } = res.data.data;
      signIn(accessToken, user);
      router.replace(redirect || dashboardPathForRole(user.role));
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message.toLowerCase().includes('email not verified')) {
        const query = new URLSearchParams({ email: values.email, flow: 'signup' });
        if (redirect) query.set('redirect', redirect);
        router.push(`/verify-otp?${query.toString()}`);
        return;
      }
      setServerError(message);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to access your dashboard."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-navy-600 hover:underline dark:text-navy-200">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Field label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-navy-600 hover:underline dark:text-navy-200">
            Forgot password?
          </Link>
        </div>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Signing in…</> : 'Continue'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="animate-spin text-navy-500" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
