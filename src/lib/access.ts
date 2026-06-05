import type { Division, User, UserRole } from '@/lib/supabase/types';

const CORE_ROLES: UserRole[] = ['owner', 'executive', 'lead'];
const PRIVILEGED_ROLES: UserRole[] = ['owner', 'executive'];
const ADMIN_EMAILS = new Set([
  'allan.chan@elevateoco.com',
  'hazem.dweik@elevateoco.com',
  'arnis.piekus@elevateoco.com',
  'bailey.barry@elevateoco.co.uk',
  'arnis@elevateoco.com',
  'bailey@elevateoco.com',
]);
const FULL_ORG_PEOPLE_OPS_EMAILS = new Set([
  'allan.chan@elevateoco.com',
  'hazem.dweik@elevateoco.com',
]);

export function isCoreMember(user: Pick<User, 'role'> | null | undefined) {
  return !!user && CORE_ROLES.includes(user.role);
}

export function isPrivilegedRole(role: UserRole) {
  return PRIVILEGED_ROLES.includes(role);
}

export function isAdminUser(
  user: Pick<User, 'role' | 'division_id' | 'email'> | null | undefined,
  divisions: Pick<Division, 'id' | 'code'>[],
) {
  if (!user) return false;
  if (user.role === 'owner') return true;
  if (ADMIN_EMAILS.has(user.email.toLowerCase())) return true;
  const adminDivision = divisions.find((division) => division.code === 'admin');
  return !!adminDivision && user.division_id === adminDivision.id;
}

export function canManageWholeOrg(
  user: Pick<User, 'role' | 'division_id' | 'email'> | null | undefined,
  divisions: Pick<Division, 'id' | 'code'>[],
) {
  if (!user) return false;
  if (FULL_ORG_PEOPLE_OPS_EMAILS.has(user.email.toLowerCase())) return true;
  return isAdminUser(user, divisions);
}
