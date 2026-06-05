import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronDown, ExternalLink, Settings2 } from 'lucide-react';
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
  const categories = libraries.reduce((groups, library) => {
    const category = library.category || 'General';
    const entries = groups.get(category) ?? [];
    entries.push(library);
    groups.set(category, entries);
    return groups;
  }, new Map<string, typeof libraries>());

  return (
    <div>
      <PageHeader
        title="SOP library"
        description="Standard operating procedures, division playbooks, and onboarding guides. You only see the libraries you have access to."
      />

      <div className="space-y-6 p-7">
        {isAdmin ? <LibraryCreateForm /> : null}

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
          <div className="space-y-4">
            {Array.from(categories.entries()).map(([category, entries]) => (
              <details
                key={category}
                open
                className="group/category overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5">
                  <div>
                    <h2 className="text-[14px] font-semibold text-[var(--color-fg)]">{category}</h2>
                    <p className="text-[11px] text-[var(--color-fg-dim)]">
                      {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[var(--color-fg-dim)] transition-transform group-open/category:rotate-180" />
                </summary>
                <div className="grid gap-4 border-t border-[var(--color-border)] p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map((lib) => (
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
                        <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-[var(--color-fg)] group-hover:underline">
                          {lib.name}
                        </h3>
                        <p className="mt-1 text-[13px] text-[var(--color-fg-muted)]">
                          {lib.description}
                        </p>
                      </a>
                    </Card>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
