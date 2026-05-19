'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';

async function assertAdmin() {
  const { profile } = await requireCurrentUser();
  if (profile.role === 'owner') return { profile, error: null };
  const supabase = await createClient();
  const { data: div } = await supabase
    .from('divisions')
    .select('id, code')
    .eq('code', 'admin')
    .maybeSingle();
  if (div && profile.division_id === div.id) return { profile, error: null };
  return { profile: null, error: 'Not authorized' };
}

const CreateSchema = z.object({
  title: z.string().min(2).max(120),
  body: z.string().min(1).max(4000),
  pinned: z.string().optional(),
  expires_at: z.string().optional().or(z.literal('')),
});

export async function createAnnouncement(formData: FormData) {
  const gate = await assertAdmin();
  if (gate.error) return { error: gate.error };

  const parsed = CreateSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    pinned: formData.get('pinned') ?? undefined,
    expires_at: formData.get('expires_at') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: parsed.data.title,
      body: parsed.data.body,
      author_id: gate.profile!.id,
      pinned: parsed.data.pinned === 'on' || parsed.data.pinned === 'true',
      expires_at: parsed.data.expires_at
        ? new Date(parsed.data.expires_at).toISOString()
        : null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  const { error: fanoutError } = await supabase.rpc('fanout_announcement', {
    p_announcement_id: data!.id,
  });
  if (fanoutError) return { error: fanoutError.message };

  revalidatePath('/app/admin/announcements');
  revalidatePath('/app');
  revalidatePath('/app/inbox');
  return { ok: true };
}

export async function deleteAnnouncement(id: string) {
  const gate = await assertAdmin();
  if (gate.error) return { error: gate.error };

  const supabase = await createClient();
  const { data: ann } = await supabase
    .from('announcements')
    .select('title, body')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) return { error: error.message };

  if (ann) {
    await supabase
      .from('notifications')
      .delete()
      .eq('type', 'announcement')
      .eq('title', (ann as { title: string }).title)
      .eq('body', (ann as { body: string }).body);
  }

  revalidatePath('/app/admin/announcements');
  revalidatePath('/app');
  revalidatePath('/app/inbox');
  return { ok: true };
}

/**
 * Nuclear option: wipe every announcement-type notification from every inbox.
 * Useful for cleaning up test posts. Does NOT touch the announcements source
 * table itself or any chat/task notifications.
 */
export async function clearAllAnnouncementNotifications() {
  const gate = await assertAdmin();
  if (gate.error) return { error: gate.error };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from('notifications')
    .delete({ count: 'exact' })
    .eq('type', 'announcement');
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'notification',
    entity_id: gate.profile!.id,
    actor_id: gate.profile!.id,
    action: `cleared ${count ?? 0} announcement notifications from all inboxes`,
  });

  revalidatePath('/app/admin/announcements');
  revalidatePath('/app/inbox');
  return { ok: true, count: count ?? 0 };
}
