'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const Schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  })
  .refine((d) => d.password !== 'password123', {
    message: 'Please pick a new password (not the placeholder).',
    path: ['password'],
  });

export type ChangePasswordState = { error?: string } | undefined;

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const parsed = Schema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'Not signed in.' };

  const meta = (userData.user.user_metadata ?? {}) as Record<string, unknown>;
  const nextMeta = { ...meta, must_change_password: false };

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: nextMeta,
  });
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect('/app');
}
