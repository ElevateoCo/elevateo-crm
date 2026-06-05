'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';
import type { Division } from '@/lib/supabase/types';
import { isAdminUser, isCoreMember, isPrivilegedRole } from '@/lib/access';

const UserPatch = z.object({
  full_name: z.string().min(1).optional(),
  role: z.enum(['owner', 'executive', 'lead', 'member', 'reservist', 'external']).optional(),
  division_id: z.string().uuid().optional().or(z.literal('')),
  manager_id: z.string().uuid().optional().or(z.literal('')),
  is_active: z.string().optional(), // checkbox sends "on"
});

const ADMIN_GRANTOR_EMAILS = new Set([
  'allan.chan@elevateoco.com',
  'arnis@elevateoco.com',
  'arnis.piekus@elevateoco.com',
  'hazem.dweik@elevateoco.com',
]);

export async function updateUserAdmin(id: string, formData: FormData) {
  const { profile } = await requireCurrentUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = UserPatch.safeParse(raw);
  if (!parsed.success) return { error: 'Invalid input' };

  const supabase = await createClient();
  const [{ data: divisions }, { data: targetUser }] = await Promise.all([
    supabase.from('divisions').select('id, code'),
    supabase.from('users').select('id, role, division_id').eq('id', id).maybeSingle(),
  ]);
  const divisionRows = (divisions ?? []) as Pick<Division, 'id' | 'code'>[];
  const adminDivisionId = divisionRows.find(
    (division) => division.code === 'admin'
  )?.id;
  const isAdmin = isAdminUser(profile, divisionRows);
  const isCore = isCoreMember(profile);
  const isGrantor = ADMIN_GRANTOR_EMAILS.has(profile.email.toLowerCase());
  const isGrantingAdminPrivilege =
    parsed.data.role === 'owner' ||
    (!!adminDivisionId && parsed.data.division_id === adminDivisionId);
  const target = targetUser as Pick<typeof profile, 'role' | 'division_id'> | null;

  if (!isCore) {
    return { error: 'Not authorized' };
  }

  if (!target) {
    return { error: 'User not found' };
  }

  if (!isAdmin) {
    const targetIsProtected =
      isPrivilegedRole(target.role) || (!!adminDivisionId && target.division_id === adminDivisionId);
    if (targetIsProtected) {
      return { error: 'Core members cannot edit owner, executive, or admin-division users.' };
    }
    if (parsed.data.role && isPrivilegedRole(parsed.data.role)) {
      return { error: 'Core members cannot assign owner or executive roles.' };
    }
  }

  if (isGrantingAdminPrivilege && !isGrantor) {
    return { error: 'Only Allan, Arnis, or Hazem can grant admin privileges.' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      division_id: parsed.data.division_id || null,
      manager_id: parsed.data.manager_id || null,
      is_active: parsed.data.is_active === 'on' || parsed.data.is_active === 'true',
    })
    .eq('id', id);
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'user',
    entity_id: id,
    actor_id: profile.id,
    action: 'updated user',
  });

  revalidatePath('/app/admin/people');
  revalidatePath('/app/reports');
  revalidatePath('/app/people');
  return { ok: true };
}

export async function updateDivisionOwner(id: string, ownerId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from('divisions').update({ owner_id: ownerId }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/app/admin/divisions');
  return { ok: true };
}
