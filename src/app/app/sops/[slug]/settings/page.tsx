import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/shell/page-header';
import { Button } from '@/components/ui/button';
import { getCurrentUser, getDivisions } from '@/lib/queries';
import { isAdminUser } from '@/lib/access';
import { getLibraryBySlug, getLibraryAccessRoles } from '@/lib/library/query';
import { setLibraryAccessAction } from '@/app/app/sops/actions';
import type { UserRole } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

// Grantable roles (admins/owners always have access, so they are not listed).
const ROLE_OPTIONS: Array<{ role: UserRole; label: string; hint: string }> = [
  { role: 'executive', label: 'Executive', hint: 'Division owners' },
  { role: 'lead', label: 'Lead', hint: 'Team leads / managers' },
  { role: 'member', label: 'Member', hint: 'Standard partners' },
  { role: 'reservist', label: 'Reservist', hint: 'On-call / backup' },
  { role: 'external', label: 'External', hint: 'Outside collaborators' },
];

export default async function LibraryAccessSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getCurrentUser();
  if (!session?.profile) redirect('/login');
  const divisions = await getDivisions();
  if (!isAdminUser(session.profile, divisions)) notFound();

  const library = await getLibraryBySlug(slug);
  if (!library) notFound();

  const granted = new Set(await getLibraryAccessRoles(library.id));

  return (
    <div>
      <PageHeader
        title={`${library.name} — Access`}
        description="Choose which roles can open this library. Owners and admins always have access and can manage it."
        meta={
          <Link href="/app/sops" className="text-[12px] text-[var(--color-fg-muted)] hover:underline">
            &larr; All libraries
          </Link>
        }
      />

      <div className="p-7">
        <form action={setLibraryAccessAction} className="max-w-2xl space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.role}
                className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-[var(--color-surface-3)]"
              >
                <input
                  type="checkbox"
                  name="roles"
                  value={opt.role}
                  defaultChecked={granted.has(opt.role)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                <span>
                  <span className="block text-[14px] text-[var(--color-fg)]">{opt.label}</span>
                  <span className="block text-[11px] text-[var(--color-fg-dim)]">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-[var(--color-fg-dim)]">
            Owners and admin-division members always have access and are not listed here.
          </p>
          <div className="flex justify-end">
            <Button type="submit">Save access</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
