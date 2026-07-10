'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/errors';

const profileSchema = z.object({
  name: z.string().min(2, 'Enter your name'),
  phone: z.string().min(7, 'Enter a valid phone').max(15).optional().or(z.literal('')),
  state: z.string().min(2).max(50).optional().or(z.literal('')),
  academyId: z.string().optional().or(z.literal('')),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Needs an uppercase letter').regex(/[0-9]/, 'Needs a number'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });
type PasswordValues = z.infer<typeof passwordSchema>;

function Notice({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return <p className={type === 'success' ? 'text-sm text-green-600' : 'text-sm text-red-600'}>{msg}</p>;
}

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [academies, setAcademies] = useState<{ id: string; name: string }[]>([]);

  const profileForm = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    Promise.all([
      api.get('/students/profile'),
      api.get('/students/academies'),
    ])
      .then(([profileRes, academiesRes]) => {
        const p = profileRes.data.data;
        profileForm.reset({
          name: p?.name ?? '',
          phone: p?.phone ?? '',
          state: p?.state ?? '',
          academyId: p?.academyId ?? '',
        });
        setAcademies(academiesRes.data.data ?? []);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile(values: ProfileValues) {
    setProfileMsg(null);
    try {
      await api.patch('/students/profile', {
        name: values.name,
        phone: values.phone || undefined,
        state: values.state || undefined,
        academyId: values.academyId || null,
      });
      await refreshUser();
      setProfileMsg({ type: 'success', msg: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ type: 'error', msg: getApiErrorMessage(err) });
    }
  }

  async function changePassword(values: PasswordValues) {
    setPwMsg(null);
    try {
      await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      setPwMsg({ type: 'success', msg: 'Password changed.' });
    } catch (err) {
      setPwMsg({ type: 'error', msg: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h2 className="font-heading text-2xl font-bold text-foreground">Profile</h2>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 font-heading text-lg font-bold text-foreground">Personal details</h3>
        <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4" noValidate>
          <Field label="Full name" error={profileForm.formState.errors.name?.message} {...profileForm.register('name')} />
          <Field label="Phone" placeholder="+91…" error={profileForm.formState.errors.phone?.message} {...profileForm.register('phone')} />
          <Field label="State" placeholder="e.g. Jharkhand" error={profileForm.formState.errors.state?.message} {...profileForm.register('state')} />
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Academy</label>
            <select
              {...profileForm.register('academyId')}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">Select academy</option>
              {academies.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          {profileMsg && <Notice type={profileMsg.type} msg={profileMsg.msg} />}
          <Button type="submit" disabled={profileForm.formState.isSubmitting}>
            {profileForm.formState.isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Saving…</> : 'Save changes'}
          </Button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 font-heading text-lg font-bold text-foreground">Change password</h3>
        <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4" noValidate>
          <Field label="Current password" type="password" error={passwordForm.formState.errors.currentPassword?.message} {...passwordForm.register('currentPassword')} />
          <Field label="New password" type="password" error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register('newPassword')} />
          <Field label="Confirm new password" type="password" error={passwordForm.formState.errors.confirm?.message} {...passwordForm.register('confirm')} />
          {pwMsg && <Notice type={pwMsg.type} msg={pwMsg.msg} />}
          <Button type="submit" variant="secondary" disabled={passwordForm.formState.isSubmitting}>
            {passwordForm.formState.isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Updating…</> : 'Update password'}
          </Button>
        </form>
      </section>
    </div>
  );
}
