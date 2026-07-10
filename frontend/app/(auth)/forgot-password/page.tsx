'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { forgotSchema, type ForgotValues } from '@/lib/validations';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/errors';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  async function onSubmit(values: ForgotValues) {
    setServerError(null);
    try {
      await api.post('/auth/forgot-password', values);
      router.push(`/reset-password?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset code."
      footer={
        <Link href="/login" className="font-semibold text-navy-600 hover:underline dark:text-navy-200">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Sending…</> : 'Send reset code'}
        </Button>
      </form>
    </AuthCard>
  );
}
