'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { signupSchema, type SignupValues } from '@/lib/validations';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/errors';

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '';
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupValues) {
    setServerError(null);
    try {
      await api.post('/auth/signup', values);
      const query = new URLSearchParams({ email: values.email, flow: 'signup' });
      if (redirect) query.set('redirect', redirect);
      router.push(`/verify-otp?${query.toString()}`);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Bokaro Defence Academy and start preparing today."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}
            className="font-semibold text-navy-600 hover:underline dark:text-navy-200"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Full name" placeholder="Your name" error={errors.name?.message} {...register('name')} />
        <Field label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Field label="Password" type="password" placeholder="Min. 8 characters" error={errors.password?.message} {...register('password')} />
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Creating…</> : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="animate-spin text-navy-500" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
