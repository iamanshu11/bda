'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { resetSchema, type ResetValues } from '@/lib/validations';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/errors';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: params.get('email') ?? '' },
  });

  async function onSubmit(values: ResetValues) {
    setServerError(null);
    try {
      await api.post('/auth/reset-password', values);
      router.push('/login');
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="Enter the code from your email and a new password."
      footer={
        <Link href="/login" className="font-semibold text-navy-600 hover:underline dark:text-navy-200">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Field label="Reset code" inputMode="numeric" maxLength={6} placeholder="6-digit code" error={errors.code?.message} {...register('code')} />
        <Field label="New password" type="password" placeholder="Min. 8 characters" error={errors.newPassword?.message} {...register('newPassword')} />
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Resetting…</> : 'Reset password'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="animate-spin text-navy-500" /></div>}>
      <ResetForm />
    </Suspense>
  );
}
