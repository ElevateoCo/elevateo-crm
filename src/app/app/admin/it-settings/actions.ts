'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';

const Roles = ['owner', 'executive', 'lead', 'member', 'reservist', 'external'] as const;
const Divisions = ['sales', 'marketing', 'technology', 'ecommerce', 'admin'] as const;

const CreateSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1).max(120),
  role: z.enum(Roles).default('member'),
  division_code: z.enum(Divisions).optional().or(z.literal('')),
  manager_email: z.string().email().optional().or(z.literal('')),
});

async function assertAdmin() {
  const { profile } = await requireCurrentUser();
  if (profile.role !== 'owner') {
    const supabase = await createClient();
    const { data: div } = await supabase
      .from('divisions')
      .select('id, code')
      .eq('code', 'admin')
      .maybeSingle();
    if (!div || profile.division_id !== div.id) {
      return { error: 'Not authorized', profile: null as any };
    }
  }
  return { profile };
}

export async function itCreateUser(formData: FormData) {
  const gate = await assertAdmin();
  if (gate.error) return { error: gate.error };

  const parsed = CreateSchema.safeParse({
    email: formData.get('email'),
    full_name: formData.get('full_name'),
    role: formData.get('role') || 'member',
    division_code: formData.get('division_code') || '',
    manager_email: formData.get('manager_email') || '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_create_user', {
    p_email: parsed.data.email,
    p_full_name: parsed.data.full_name,
    p_role: parsed.data.role,
    p_division_code: parsed.data.division_code || null,
    p_manager_email: parsed.data.manager_email || null,
  });
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'user',
    entity_id: gate.profile.id,
    actor_id: gate.profile.id,
    action: `created user ${parsed.data.email}`,
  });

  revalidatePath('/app/admin/it-settings');
  revalidatePath('/app/admin/people');
  return { ok: true };
}

export async function itDeleteUser(userId: string) {
  const gate = await assertAdmin();
  if (gate.error) return { error: gate.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'user',
    entity_id: userId,
    actor_id: gate.profile.id,
    action: 'deleted user',
  });

  revalidatePath('/app/admin/it-settings');
  revalidatePath('/app/admin/people');
  return { ok: true };
}

export async function itResetPassword(userId: string) {
  const gate = await assertAdmin();
  if (gate.error) return { error: gate.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_reset_password', { p_user_id: userId });
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'user',
    entity_id: userId,
    actor_id: gate.profile.id,
    action: 'reset password (placeholder + force change)',
  });

  revalidatePath('/app/admin/it-settings');
  return { ok: true };
}

export async function itUpdateEmail(userId: string, newEmail: string) {
  const gate = await assertAdmin();
  if (gate.error) return { error: gate.error };

  const parsed = z.string().email().safeParse(newEmail);
  if (!parsed.success) return { error: 'Invalid email' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_update_email', {
    p_user_id: userId,
    p_new_email: parsed.data,
  });
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'user',
    entity_id: userId,
    actor_id: gate.profile.id,
    action: `changed email to ${parsed.data}`,
  });

  revalidatePath('/app/admin/it-settings');
  return { ok: true };
}

export async function itUpdateFullName(userId: string, newName: string) {
  const gate = await assertAdmin();
  if (gate.error) return { error: gate.error };

  const parsed = z.string().min(1).max(120).safeParse(newName);
  if (!parsed.success) return { error: 'Invalid name' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_update_full_name', {
    p_user_id: userId,
    p_new_name: parsed.data,
  });
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'user',
    entity_id: userId,
    actor_id: gate.profile.id,
    action: `renamed to ${parsed.data}`,
  });

  revalidatePath('/app/admin/it-settings');
  return { ok: true };
}
