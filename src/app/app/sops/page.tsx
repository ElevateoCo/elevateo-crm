import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink, Settings2 } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
import { getCurrentUser, getDivisions } from '@/lib/queries';
import { isAdminUser } from '@/lib/access';
import { getLibraries } from '@/lib/library/query';
import { LibraryCreateForm } from './library-create-form';

export const dynamic = 'force-dynamic';

export default async function SopsPage() {
  const session = await getCurrentUser();
  if (!session?.profile) redirect('/login');
  const divisions = await getDivisions();
  const isAdmin = isAdminUser(session.profile, divisions);

  // RLS filters to libraries this user may open (admins see all).
  const libraries = await getLibraries();

  return (
    <div>
      <PageHeader
        title="SOP library"
        description="Standard operating procedures, division playbooks, and onboarding guides. You only see the libraries you have access to."
      />

      <div className="space-y-6 p-7">
        {isAdmin ? (
          <Card className="bg-white p-5">
            <div className="mb-4">
              <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-fg)]">
                Add library entry
              </h2>
              <p className="mt-1 text-[12px] text-[var(--color-fg-muted)]">
                Create a link to a playbook, SOP folder, or onboarding resource.
              </p>
            </div>
            <LibraryCreateForm />
          </Card>
        ) : null}

        {libraries.length === 0 ? (
          <Card className="bg-white p-10 text-center">
            <div className="mx-auto max-w-md">
              <h2 className="text-[18px] font-semibold text-[var(--color-fg)]">No libraries yet</h2>
              <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">
                You do not have access to any SOP libraries right now. Ask an admin to grant access.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {libraries.map((lib) => (
              <Card key={lib.id} className="group relative bg-white p-5 transition hover:shadow-sm">
                {isAdmin ? (
                  <Link
                    href={`/app/sops/${lib.slug}/settings`}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--color-fg-dim)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)]"
                    title="Manage access"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Link>
                ) : null}
                <a
                  href={lib.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <ExternalLink className="h-5 w-5 text-[var(--color-fg-muted)]" />
                  <h2 className="mt-3 text-[15px] font-semibold tracking-tight text-[var(--color-fg)] group-hover:underline">
                    {lib.name}
                  </h2>
                  <p className="mt-1 text-[13px] text-[var(--color-fg-muted)]">{lib.description}</p>
                </a>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
