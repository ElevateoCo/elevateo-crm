'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';

const AVATAR_MAX_BYTES = 200_000;

const avatarField = z
  .string()
  .max(AVATAR_MAX_BYTES, 'Avatar image is too large (resize to under 200 KB).')
  .refine(
    (v) =>
      v === '' ||
      v.startsWith('data:image/') ||
      /^https?:\/\//.test(v),
    'Avatar must be an uploaded image or a URL.',
  );

const Patch = z.object({
  full_name: z.string().min(1).max(120),
  avatar_url: avatarField.optional().or(z.literal('')),
  skin_tone: z.string().max(40).optional().or(z.literal('')),
  cold_call_goal: z.coerce.number().int().min(0).max(500),
});

export async function updateProfile(formData: FormData) {
  const { profile } = await requireCurrentUser();
  const parsed = Patch.safeParse({
    full_name: formData.get('full_name'),
    avatar_url: formData.get('avatar_url') ?? '',
    skin_tone: formData.get('skin_tone') ?? '',
    cold_call_goal: formData.get('cold_call_goal') ?? 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({
      full_name: parsed.data.full_name,
      avatar_url: parsed.data.avatar_url || null,
      skin_tone: parsed.data.skin_tone || null,
      cold_call_goal: parsed.data.cold_call_goal,
    })
    .eq('id', profile.id);

  if (error) return { error: error.message };
  revalidatePath('/app', 'layout');
  return { ok: true };
}
