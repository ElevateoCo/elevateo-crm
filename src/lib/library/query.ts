import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/supabase/types';
import type { Library } from './types';

/**
 * Libraries the current user may open. RLS on `libraries` already filters to
 * granted libraries (admins see all), so we just read the table.
 */
export async function getLibraries(): Promise<Library[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('libraries')
    .select('id, slug, name, category, description, url, sort_order, created_at')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });
  return (data ?? []) as Library[];
}

export async function getLibraryBySlug(slug: string): Promise<Library | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('libraries')
    .select('id, slug, name, category, description, url, sort_order, created_at')
    .eq('slug', slug)
    .maybeSingle();
  return (data as Library) ?? null;
}

/** Roles currently granted access (admins are implicit, not listed). */
export async function getLibraryAccessRoles(libraryId: string): Promise<UserRole[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('library_access')
    .select('role')
    .eq('library_id', libraryId);
  return ((data ?? []) as Array<{ role: UserRole }>).map((r) => r.role);
}

/**
 * Replace the role grants for a library. Admin-only at the RLS layer; callers
 * should also gate on isAdminUser before invoking.
 */
export async function setLibraryAccess(libraryId: string, roles: UserRole[]): Promise<void> {
  const supabase = await createClient();
  await supabase.from('library_access').delete().eq('library_id', libraryId);
  const unique = Array.from(new Set(roles));
  if (unique.length > 0) {
    await supabase
      .from('library_access')
      .insert(unique.map((role) => ({ library_id: libraryId, role })));
  }
}
