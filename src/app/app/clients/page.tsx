import Link from 'next/link';
import { Building2, Plus, LayoutGrid, List } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPill } from '@/components/shared/user-pill';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ClientForm } from './client-form';
import {
  getAllClientMembers,
  getAllUsers,
  getClients,
  getDivisions,
  getProjects,
  requireCurrentUser,
} from '@/lib/queries';
import { clientStatusTone, divisionTone } from '@/lib/formatters';
import { formatDate } from '@/lib/utils';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; view?: string }>;
}) {
  const { filter = 'current', view = 'list' } = await searchParams;
  const isGrid = view === 'grid';
  const { profile } = await requireCurrentUser();
  const [clients, users, divisions, projects, clientMembers] = await Promise.all([
    getClients(),
    getAllUsers(),
    getDivisions(),
    getProjects(),
    getAllClientMembers(),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const divMap = new Map(divisions.map((d) => [d.id, d]));
  const myClientIds = new Set(
    clients
      .filter(
        (client) =>
          client.account_lead_id === profile.id ||
          clientMembers.some((member) => member.client_id === client.id && member.user_id === profile.id) ||
          projects.some((project) => project.client_id === client.id && project.lead_id === profile.id),
      )
      .map((client) => client.id),
  );
  const filters: Array<{ label: string; key: string }> = [
    { label: 'Mine', key: 'mine' },
    { label: 'Current', key: 'current' },
    { label: 'All', key: 'all' },
  ];

  let visibleClients = clients;
  if (filter === 'mine') {
    visibleClients = clients.filter((client) => myClientIds.has(client.id));
  } else if (filter === 'current') {
    visibleClients = clients.filter((client) => client.status === 'active');
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        description="All accounts. Track status, primary division, and the lead on the account."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" /> New client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New client</DialogTitle>
              </DialogHeader>
              <ClientForm divisions={divisions} users={users} />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="px-6 pt-4 pb-2 flex items-center gap-1.5">
        {filters.map((item) => {
          const active = filter === item.key;
          return (
            <Link
              key={item.key}
              href={`/app/clients?filter=${item.key}&view=${view}`}
              className={`text-xs px-2.5 py-1 rounded-md border ${
                active
                  ? 'bg-[var(--color-surface-3)] border-[var(--color-border-strong)]'
                  : 'border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <div className="ml-auto flex items-center gap-1">
          <Link
            href={`/app/clients?filter=${filter}&view=list`}
            aria-label="List view"
            className={`p-1.5 rounded-md border ${
              !isGrid
                ? 'bg-[var(--color-surface-3)] border-[var(--color-border-strong)]'
                : 'border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)]'
            }`}
          >
            <List className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/app/clients?filter=${filter}&view=grid`}
            aria-label="Grid view"
            className={`p-1.5 rounded-md border ${
              isGrid
                ? 'bg-[var(--color-surface-3)] border-[var(--color-border-strong)]'
                : 'border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)]'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="p-6 pt-2">
        {visibleClients.length === 0 ? (
          <Card>
            <div className="px-4 py-10 text-center text-sm text-[var(--color-fg-dim)]">
              No clients match this filter.
            </div>
          </Card>
        ) : isGrid ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {visibleClients.map((c) => {
              const div = c.primary_division_id ? divMap.get(c.primary_division_id) : null;
              const lead = c.account_lead_id ? userMap.get(c.account_lead_id) : null;
              return (
                <Link
                  key={c.id}
                  href={`/app/clients/${c.id}`}
                  className="flex aspect-square flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-3)]">
                      <Building2 className="h-4 w-4 text-[var(--color-fg-muted)]" />
                    </div>
                    <Badge tone={clientStatusTone[c.status]} className="capitalize">
                      {c.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex-1">
                    <div className="line-clamp-2 text-sm font-semibold text-[var(--color-fg)]">
                      {c.name}
                    </div>
                    {c.contact_name ? (
                      <div className="mt-0.5 truncate text-xs text-[var(--color-fg-muted)]">
                        {c.contact_name}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {div ? (
                      <Badge tone={divisionTone[div.code] as any}>{div.name}</Badge>
                    ) : (
                      <span className="text-[11px] text-[var(--color-fg-dim)]">—</span>
                    )}
                    <UserPill user={lead ?? null} size="xs" />
                  </div>
                  <div className="mt-2 text-[11px] text-[var(--color-fg-dim)]">
                    Updated {formatDate(c.updated_at)}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <div className="grid grid-cols-[1fr_120px_180px_160px_120px] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] px-4 py-2 border-b border-[var(--color-border)]">
              <div>Name</div>
              <div>Status</div>
              <div>Division</div>
              <div>Lead</div>
              <div className="text-right">Updated</div>
            </div>
            {visibleClients.map((c) => {
              const div = c.primary_division_id ? divMap.get(c.primary_division_id) : null;
              const lead = c.account_lead_id ? userMap.get(c.account_lead_id) : null;
              return (
                <Link
                  key={c.id}
                  href={`/app/clients/${c.id}`}
                  className="grid grid-cols-[1fr_120px_180px_160px_120px] items-center px-4 py-3 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded bg-[var(--color-surface-3)] flex items-center justify-center">
                      <Building2 className="h-3.5 w-3.5 text-[var(--color-fg-muted)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      {c.contact_name ? (
                        <div className="text-[11px] text-[var(--color-fg-dim)] truncate">
                          {c.contact_name}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <Badge tone={clientStatusTone[c.status]} className="capitalize">
                      {c.status}
                    </Badge>
                  </div>
                  <div>
                    {div ? (
                      <Badge tone={divisionTone[div.code] as any}>{div.name}</Badge>
                    ) : (
                      <span className="text-[11px] text-[var(--color-fg-dim)]">—</span>
                    )}
                  </div>
                  <div>
                    <UserPill user={lead ?? null} size="xs" />
                  </div>
                  <div className="text-right text-[11px] text-[var(--color-fg-dim)]">
                    {formatDate(c.updated_at)}
                  </div>
                </Link>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
