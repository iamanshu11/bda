'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { contactSchema, type ContactFormValues } from '@/lib/validations';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full rounded-md border bg-background px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-navy-500';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(values: ContactFormValues) {
    setServerError(null);
    try {
      await api.post('/contact', values);
      setSubmitted(true);
      reset();
    } catch {
      // Backend may not be running yet — still confirm optimistically in dev.
      setServerError(
        'We could not reach the server right now. Please try again later or call us directly.',
      );
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-10 text-center">
        <CheckCircle2 className="text-green-600" size={48} />
        <h3 className="mt-4 font-heading text-xl font-bold text-foreground">Message sent!</h3>
        <p className="mt-2 text-muted">Thanks for reaching out. Our team will get back to you shortly.</p>
        <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
          <input
            {...register('name')}
            placeholder="Your full name"
            className={cn(fieldBase, errors.name ? 'border-red-500' : 'border-border')}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            className={cn(fieldBase, errors.email ? 'border-red-500' : 'border-border')}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Phone (optional)</label>
          <input
            {...register('phone')}
            placeholder="+919525973090"
            className={cn(fieldBase, errors.phone ? 'border-red-500' : 'border-border')}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Subject (optional)</label>
          <input
            {...register('subject')}
            placeholder="Course enquiry"
            className={cn(fieldBase, 'border-border')}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Message</label>
        <textarea
          {...register('message')}
          rows={5}
          placeholder="How can we help you?"
          className={cn(fieldBase, 'resize-none', errors.message ? 'border-red-500' : 'border-border')}
        />
        {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={18} /> Sending…
          </>
        ) : (
          'Send Message'
        )}
      </Button>
    </form>
  );
}
