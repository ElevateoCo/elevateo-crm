'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser, getDivisions } from '@/lib/queries';
import { isAdminUser } from '@/lib/access';
import { getLibraryBySlug, setLibraryAccess } from '@/lib/library/query';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

const VALID_ROLES: ReadonlySet<UserRole> = new Set([
  'owner',
  'executive',
  'lead',
  'member',
  'reservist',
  'external',
]);

const CreateLibrarySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  category: z.string().trim().min(2, 'Category must be at least 2 characters').max(50),
  description: z.string().trim().max(500),
  url: z
    .string()
    .trim()
    .url('Enter a valid URL')
    .refine((url) => url.startsWith('https://') || url.startsWith('http://'), {
      message: 'URL must start with http:// or https://',
    }),
});

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'library'
  );
}

export async function createLibraryAction(formData: FormData) {
  const session = await getCurrentUser();
  const divisions = await getDivisions();
  if (!isAdminUser(session?.profile ?? null, divisions)) {
    return { error: 'Not authorized' };
  }

  const parsed = CreateLibrarySchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category') || 'General',
    description: formData.get('description') ?? '',
    url: formData.get('url'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid library entry' };
  }

  const supabase = await createClient();
  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let suffix = 2;

  while (await getLibraryBySlug(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const { data: lastLibrary } = await supabase
    .from('libraries')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('libraries').insert({
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description,
    url: parsed.data.url,
    slug,
    sort_order: ((lastLibrary as { sort_order?: number } | null)?.sort_order ?? -1) + 1,
  });
  if (error) return { error: error.message };

  revalidatePath('/app/sops');
  return { ok: true, slug };
}

export async function setLibraryAccessAction(formData: FormData) {
  const session = await getCurrentUser();
  const divisions = await getDivisions();
  if (!isAdminUser(session?.profile ?? null, divisions)) {
    throw new Error('Not authorized');
  }

  const slug = String(formData.get('slug') ?? '');
  const library = await getLibraryBySlug(slug);
  if (!library) throw new Error('Library not found');

  const roles = formData
    .getAll('roles')
    .map(String)
    .filter((r): r is UserRole => VALID_ROLES.has(r as UserRole));
  await setLibraryAccess(library.id, roles);

  revalidatePath(`/app/sops/${slug}`);
  revalidatePath(`/app/sops/${slug}/settings`);
  revalidatePath('/app/sops');
}
