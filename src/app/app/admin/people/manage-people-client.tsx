'use client';

import { useMemo, useState } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPill } from '@/components/shared/user-pill';
import { PersonEditor } from './person-editor';
import { divisionTone, roleLabel } from '@/lib/formatters';
import type { Division, User, UserRole } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

type SortKey = 'name' | 'role' | 'division' | 'manager' | 'active';
type SortDir = 'asc' | 'desc';

const ROLE_OPTIONS: UserRole[] = ['owner', 'executive', 'lead', 'member', 'reservist', 'external'];

export function ManagePeopleClient({
  users,
  divisions,
  canGrantAdmin,
}: {
  users: User[];
  divisions: Division[];
  canGrantAdmin: boolean;
}) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [divisionFilter, setDivisionFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const divMap = useMemo(() => new Map(divisions.map((d) => [d.id, d])), [divisions]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = users;
    if (q) {
      result = result.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }
    if (roleFilter) result = result.filter((u) => u.role === roleFilter);
    if (divisionFilter) result = result.filter((u) => u.division_id === divisionFilter);
    if (activeFilter !== 'all') {
      result = result.filter((u) => (activeFilter === 'active' ? u.is_active : !u.is_active));
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...result].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'name') {
        av = (a.full_name || a.email).toLowerCase();
        bv = (b.full_name || b.email).toLowerCase();
      } else if (sortKey === 'role') {
        av = ROLE_OPTIONS.indexOf(a.role);
        bv = ROLE_OPTIONS.indexOf(b.role);
      } else if (sortKey === 'division') {
        av = (a.division_id ? divMap.get(a.division_id)?.name : '') || '';
        bv = (b.division_id ? divMap.get(b.division_id)?.name : '') || '';
        av = (av as string).toLowerCase();
        bv = (bv as string).toLowerCase();
      } else if (sortKey === 'manager') {
        av = (a.manager_id ? userMap.get(a.manager_id)?.full_name : '') || '';
        bv = (b.manager_id ? userMap.get(b.manager_id)?.full_name : '') || '';
        av = (av as string).toLowerCase();
        bv = (bv as string).toLowerCase();
      } else if (sortKey === 'active') {
        av = a.is_active ? 1 : 0;
        bv = b.is_active ? 1 : 0;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [users, query, roleFilter, divisionFilter, activeFilter, sortKey, sortDir, divMap, userMap]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortHeader({ k, children }: { k: SortKey; children: React.ReactNode }) {
    const active = sortKey === k;
    const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className={cn(
          'flex items-center gap-1 hover:text-[var(--color-fg)] transition',
          active && 'text-[var(--color-fg)]',
        )}
      >
        {children}
        <Icon className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-fg-dim)]" />
          <Input
            placeholder="Search name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v === '__all' ? '' : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All roles</SelectItem>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {roleLabel[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={divisionFilter}
          onValueChange={(v) => setDivisionFilter(v === '__all' ? '' : v)}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All divisions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All divisions</SelectItem>
            {divisions.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-[11px] text-[var(--color-fg-dim)] ml-auto">
          {filtered.length} / {users.length}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_140px_180px_80px_100px] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] px-4 py-2 border-b border-[var(--color-border)]">
          <div><SortHeader k="name">Person</SortHeader></div>
          <div><SortHeader k="role">Role</SortHeader></div>
          <div><SortHeader k="division">Division</SortHeader></div>
          <div><SortHeader k="manager">Reports to</SortHeader></div>
          <div><SortHeader k="active">Status</SortHeader></div>
          <div className="text-right">Edit</div>
        </div>
        {filtered.map((u) => {
          const div = u.division_id ? divMap.get(u.division_id) : null;
          const manager = u.manager_id ? userMap.get(u.manager_id) : null;
          return (
            <div
              key={u.id}
              className="grid grid-cols-[1fr_120px_140px_180px_80px_100px] items-center px-4 py-2.5 border-b border-[var(--color-border)] last:border-b-0"
            >
              <UserPill user={u} />
              <div>
                <Badge tone="default">{roleLabel[u.role]}</Badge>
              </div>
              <div>
                {div ? (
                  <Badge tone={divisionTone[div.code] as any}>{div.name}</Badge>
                ) : (
                  <span className="text-[11px] text-[var(--color-fg-dim)]">—</span>
                )}
              </div>
              <div>
                {manager ? (
                  <UserPill user={manager} size="xs" />
                ) : (
                  <span className="text-[11px] text-[var(--color-fg-dim)]">—</span>
                )}
              </div>
              <div>
                {u.is_active ? (
                  <Badge tone="success">Active</Badge>
                ) : (
                  <Badge tone="default">Inactive</Badge>
                )}
              </div>
              <div className="text-right">
                <PersonEditor
                  user={u}
                  divisions={divisions}
                  users={users}
                  canGrantAdmin={canGrantAdmin}
                />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12px] text-[var(--color-fg-dim)]">
            No people match these filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}
