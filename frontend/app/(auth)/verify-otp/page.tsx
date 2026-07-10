'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { otpSchema, type OtpValues } from '@/lib/validations';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/errors';

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();

  const email = params.get('email') ?? '';
  const flow = params.get('flow');
  const redirect = params.get('redirect') ?? '';

  const [serverError, setServerError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpValues>({ resolver: zodResolver(otpSchema) });

  useEffect(() => {
    if (flow === 'login') router.replace('/login');
  }, [flow, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function onSubmit(values: OtpValues) {
    setServerError(null);
    try {
      await api.post('/auth/verify-signup', { email, code: values.code });
      router.push(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login');
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  }

  async function resend() {
    setResending(true);
    setServerError(null);
    try {
      await api.post('/auth/resend-otp', { email, purpose: 'SIGNUP' });
      setCooldown(60);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthCard
      title="Enter verification code"
      subtitle={`We sent a 6-digit code to ${email || 'your email'} to verify your account.`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          label="6-digit code"
          inputMode="numeric"
          maxLength={6}
          placeholder="••••••"
          className="text-center text-2xl tracking-[0.5em]"
          error={errors.code?.message}
          {...register('code')}
        />
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Verifying…</> : 'Verify'}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-muted">
        Didn&apos;t get it?{' '}
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resending}
          className="font-semibold text-navy-600 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline dark:text-navy-200"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </AuthCard>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="animate-spin text-navy-500" /></div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
